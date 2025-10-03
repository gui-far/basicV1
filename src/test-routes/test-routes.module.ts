import { Module } from '@nestjs/common'
import { TestRoutesController } from './test-routes.controller'
import { TestRoutesService } from './test-routes.service'

@Module({
  controllers: [TestRoutesController],
  providers: [TestRoutesService],
})
export class TestRoutesModule {}
