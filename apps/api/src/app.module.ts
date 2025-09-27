import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrgsModule } from './orgs/orgs.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';
import { User } from './entities/user.entity';
import { Organization } from './entities/org.entity';
import { Task } from './entities/task.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite',
        database: process.env.DB_PATH || './taskdb.sqlite',
        entities: [User, Organization, Task],
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    OrgsModule,
    TasksModule,
    AuditModule,
  ],
})
export class AppModule {}
