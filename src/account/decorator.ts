import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AccountService } from './service'
import { createException } from './exception'
import { UAParser } from 'ua-parser-js'


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private accountService: AccountService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const roles = this.reflector.get<string[]>('roles', context.getHandler())
    const accessToken = request.access_token

    if (!accessToken || typeof accessToken !== 'string') {
      createException('unauthorization')
    }

    const session = await this.accountService.getSessionByAccessToken(
      accessToken
    )
    if (session === null) {
      createException('unauthorization')
    }
    if (session.expireAccessToken < new Date()) {
      createException('expire')
    }

    session.ipAddress = request.remoteAddress
    session.lastUsage = new Date()
    session.device = JSON.parse(
      JSON.stringify(new UAParser(request['user-agent']).getResult()),
    )
    session.save()

    if ((session && roles === undefined) || roles.some((r) => session.user.roles.includes(r))) {
      return true
    }

    createException('forbidden')
  }
}
