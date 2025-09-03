import { Injectable } from '@nestjs/common';
import { PubSubService, UserEvent } from '../pubsub/pubsub.service';

@Injectable()
export class UsersService {
  private users: Map<string, User> = new Map();

  constructor(private readonly pubSubService: PubSubService) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user: User = {
      id: this.generateId(),
      email: createUserDto.email,
      name: createUserDto.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store user (in a real app, this would be a database)
    this.users.set(user.id, user);

    // Publish user created event
    const event: UserEvent = {
      type: 'user.created',
      userId: user.id,
      timestamp: user.createdAt.toISOString(),
      data: {
        email: user.email,
        name: user.name,
      },
    };

    try {
      const messageId = await this.pubSubService.publishUserEvent(event);
      console.log(`📤 User created event published: ${messageId}`);
    } catch (error) {
      console.error('Failed to publish user created event:', error);
      // In a real app, you might want to implement compensating actions
    }

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    // Update user data
    const updatedUser: User = {
      ...user,
      ...updateUserDto,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);

    // Publish user updated event
    const event: UserEvent = {
      type: 'user.updated',
      userId: id,
      timestamp: updatedUser.updatedAt.toISOString(),
      data: {
        changes: updateUserDto,
        previous: user,
        current: updatedUser,
      },
    };

    try {
      const messageId = await this.pubSubService.publishUserEvent(event);
      console.log(`📤 User updated event published: ${messageId}`);
    } catch (error) {
      console.error('Failed to publish user updated event:', error);
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }

    this.users.delete(id);

    // Publish user deleted event
    const event: UserEvent = {
      type: 'user.deleted',
      userId: id,
      timestamp: new Date().toISOString(),
      data: {
        deletedUser: user,
      },
    };

    try {
      const messageId = await this.pubSubService.publishUserEvent(event);
      console.log(`📤 User deleted event published: ${messageId}`);
    } catch (error) {
      console.error('Failed to publish user deleted event:', error);
    }

    return true;
  }

  async findUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

// DTOs and Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  name: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
}
