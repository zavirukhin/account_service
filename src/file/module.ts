import { Module } from '@nestjs/common'
import { FileService } from './service'


@Module({
  providers: [FileService],
  exports: [FileService],
  imports: [],
})

export class FileModule {}
