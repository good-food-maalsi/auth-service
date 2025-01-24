import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly queue = 'test';
  private readonly config = {
    protocol: 'amqp',
    hostname: 'rabbitmq',
    port: 5672,
    username: 'guest',
    password: 'guest',
    locale: 'en_US',
    frameMax: 0,
    heartbeat: 0,
    vhost: '/',
  };

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      this.connection = await amqp.connect(this.config);
      console.log('Connected to RabbitMQ server.');

      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queue, { durable: true });

      this.startPollingForMessages();
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

  private startPollingForMessages() {
    this.channel.consume(this.queue, (msg) => {
      if (msg) {
        this.onNewMessage(msg);
        this.channel.ack(msg);
      }
    });
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
