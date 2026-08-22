import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CallsService } from './calls.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private calls: CallsService) {}

  @Post('conversations/:id/calls')
  start(@CurrentUser() user: { id: string }, @Param('id') conversationId: string) {
    return this.calls.startCall(user.id, conversationId);
  }

  @Post('conversations/:id/calls/:callId/end')
  end(
    @CurrentUser() user: { id: string },
    @Param('id') conversationId: string,
    @Param('callId') callId: string,
  ) {
    return this.calls.endCall(user.id, conversationId, callId);
  }
}
