import glossy from "glossy"
import net from "net"
import os from "os"
import tls from "tls"
import { LEVEL, MESSAGE } from "triple-beam"
import Transport from "winston-transport"

export class PapertrailTransport extends Transport
{
	isConnected = false

	private buffer = ""
	private readonly facility: string
	private readonly hostname: string
	private isClosed = false
	private isConnecting = false
	private readonly keepAliveInterval = 15 * 1000 // 15 seconds
	private readonly maxBufferSize = 1024 * 1024 // 1 MB
	private readonly maxRetryAttempts = 10
	private readonly producer: glossy.Produce
	private reconnectAttempt = 0
	
	private _socket?: net.Socket
	private _stream?: net.Socket

	constructor(
		private readonly config: PapertrailTransportConfig,
	) {
		super(config)

		this.facility = config.facility || "daemon"
		this.hostname = config.hostname || os.hostname()
		this.producer = new glossy.Produce({
			facility: this.facility,
		})

		this.connectStream()
	}
	
	private get socket(): net.Socket|undefined {
		return this._socket
	}
	private set socket(socket: net.Socket|undefined) {
		if (socket === this._socket) { return }

		if (this._socket) {
			this._socket.removeAllListeners()

			try {
				this._socket.destroy()
			}
			catch(err: unknown) {
				// Handle errors silently
			}

			this._socket = undefined
		}

		this._socket = socket

		socket?.once("error", err => this.onError(err))
	}
	
	// eslint-disable-next-line @typescript-eslint/member-ordering
	private get stream(): net.Socket|undefined {
		return this._stream
	}
	private set stream(stream: net.Socket|undefined) {
		if (stream === this._stream) { return }

		if (this._stream) {
			this._stream.removeAllListeners()

			try {
				this._stream.destroy()
			}
			catch(err: unknown) {
				// Handle errors silently
			}
		}

		this._stream = stream

		stream?.once("end", () => this.connectStream())
		stream?.once("error", err => this.onError(err))
	}

	close(): void {
		this.isClosed = true
		this.socket = undefined
		this.stream = undefined
	}

	async log(info: TransportLogMessage, next: () => void) {
		await this.sendMessage(info[MESSAGE] || info.message, info[LEVEL] || info.level)
		next()
	}

	private addToBuffer(msg: string): void {
		if (this.stream?.writable) {
			this.processBuffer()
			return
		}

		if (this.buffer.length >= this.maxBufferSize) { return }

		this.buffer += msg
	}

	private connectStream(): void {
		if (this.isClosed || this.isConnecting) { return }

		this.isConnected = false
		this.isConnecting = true

		const socket = net.createConnection(
			this.config.port,
			this.config.host,
			() => {
				socket.setKeepAlive(true, this.keepAliveInterval)
				this.connectTlsSocket(socket)
			},
		)

		this.socket = socket
	}

	private connectTlsSocket(socket: net.Socket): void {
		const tlsSocket = tls.connect(
			{
				rejectUnauthorized: false,
				socket,
			},
			() => {
				this.stream = tlsSocket
				this.onConnected()
			},
		)

		this.stream = tlsSocket
	}

	private onConnected(): void {
		this.isConnected = true
		this.isConnecting = false
		this.reconnectAttempt = 0
		this.emit("connected")
		this.processBuffer()
	}

	private onError(err: Error|unknown) {
		this.isConnected = false
		this.isConnecting = false

		if (this.listeners("error").length > 0) {
			this.emit("error", err)
		}
		else {
			console.error("Papertrail connection error:", err)
		}

		this.retryConnectStream()
	}

	private processBuffer(): void {
		// Is the buffer empty?
		if (this.buffer.length === 0) { return }

		// Is the stream writable?
		if (!this.stream?.writable) { return }

		this.stream.write(
			this.buffer,
			() => {
				if (this.buffer.length === 0) {
					this.stream?.emit("empty")
				}
			},
		)

		this.buffer = ""
	}

	private retryConnectStream() {
		if (this.stream?.writable) {
			this.isConnected = true
			return
		}
		
		this.reconnectAttempt++

		if (this.reconnectAttempt < this.maxRetryAttempts) {
			setTimeout(() => {
				this.connectStream()
			}, 1000 * this.reconnectAttempt)
		}
	}

	private async sendMessage(message: string, level: string): Promise<void> {
		const lines = message ? message.split(os.EOL) : []
		const gap = "    "
		
		let msg = ""

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]

			// don't send extra message if our message ends with a newline
			if (i === lines.length - 1 && line.length === 0) {
				break
			}

			const compiledLine = this.producer.debug(
				{
					appName: this.config.program,
					date: new Date(),
					host: this.hostname,
					message: `${i > 0 ? gap : ""}${line}`,
					severity: level,
				},
			)

			if (typeof compiledLine === "string") {
				msg += `${compiledLine}\r\n`
			}
		}
		
		await new Promise<void>(resolve => {
			if (this.stream?.writable) {
				this.processBuffer()
				this.stream.write(msg, () => resolve())
			}
			else {
				this.addToBuffer(msg)
				resolve()
			}
		})
	}

}

export type PapertrailTransportConfig = Transport.TransportStreamOptions & {
	facility?: string
	host: string
	hostname?: string
	port: number
	program?: string
}

type TransportLogMessage = {
	[MESSAGE]?: string
	[LEVEL]?: string
	level: string
	message: string
}
