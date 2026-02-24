import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly queue = 'MailValidationQueue';
  private readonly config: {
    protocol: string;
    hostname: string;
    port: number;
    username: string;
    password: string;
    locale: string;
    frameMax: number;
    heartbeat: number;
    vhost: string;
  };

  constructor(private readonly configService: ConfigService) {
    this.config = {
      protocol: 'amqp',
      hostname: this.configService.get<string>('RABBITMQ_HOST', 'localhost'),
      port: this.configService.get<number>('RABBITMQ_PORT', 5672),
      username: this.configService.get<string>('RABBITMQ_USERNAME', 'guest'),
      password: this.configService.get<string>('RABBITMQ_PASSWORD', 'guest'),
      locale: 'en_US',
      frameMax: 0,
      heartbeat: 0,
      vhost: this.configService.get<string>('RABBITMQ_VHOST', '/'),
    };
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const url = `${this.config.protocol}://${this.config.username}:${this.config.password}@${this.config.hostname}:${this.config.port}${this.config.vhost}`;
      this.connection = await amqp.connect(url);
      console.log('Connected to RabbitMQ server.');

      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queue, { durable: true });

    } catch (err) {
      console.error('RabbitMQService: Connection error:', err.message);
    }
  }

  private async disconnect() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    console.log('Disconnected from RabbitMQ server.');
  }
  private onNewMessage(msg: amqp.ConsumeMessage) {
    console.log(`Received message: ${msg.content.toString()}`);
  }

  async sendMessage(messageContent: string): Promise<boolean> {
    try {
      console.log(`Sending message: ${messageContent}`);
      return this.channel.sendToQueue(this.queue, Buffer.from(messageContent));
    } catch (err) {
      console.error('RabbitMQService: Error sending message:', err.message);
      return false;
    }
  }
}
