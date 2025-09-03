import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  HttpStatus, 
  HttpException,
  HttpCode 
} from '@nestjs/common';
import { UsersService, User, CreateUserDto, UpdateUserDto } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    try {
      const user = await this.usersService.createUser(createUserDto);
      return {
        success: true,
        data: user,
        message: 'User created successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create user',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findUser(@Param('id') id: string): Promise<ApiResponse<User>> {
    const user = await this.usersService.findUser(id);
    
    if (!user) {
      throw new HttpException(
        {
          success: false,
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      data: user,
    };
  }

  @Get()
  async findAllUsers(): Promise<ApiResponse<User[]>> {
    const users = await this.usersService.findAllUsers();
    return {
      success: true,
      data: users,
      message: `Found ${users.length} users`,
    };
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<User>> {
    const user = await this.usersService.updateUser(id, updateUserDto);
    
    if (!user) {
      throw new HttpException(
        {
          success: false,
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    const deleted = await this.usersService.deleteUser(id);
    
    if (!deleted) {
      throw new HttpException(
        {
          success: false,
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}

// API Response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
