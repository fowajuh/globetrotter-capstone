import { Body, Controller, Get, Param, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import {
  CreateConversationDto,
  ListConversationsQuery,
  ListMessagesQuery,
  SendMessageDto,
} from './dto/message.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Get('conversations')
  list(@CurrentUser() user: { id: string }, @Query() query: unknown) {
    const parsed = ListConversationsQuery.safeParse(query);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.messages.listConversations(user.id, parsed.data);
  }

  @Post('conversations')
  createOrFind(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = CreateConversationDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.messages.findOrCreateConversation(user.id, parsed.data);
  }

  @Get('conversations/:id')
  get(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.messages.getConversation(user.id, id);
  }

  @Get('conversations/:id/messages')
  listMessages(@CurrentUser() user: { id: string }, @Param('id') id: string, @Query() query: unknown) {
    const parsed = ListMessagesQuery.safeParse(query);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.messages.listMessages(user.id, id, parsed.data);
  }

  @Post('conversations/:id/messages')
  send(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() body: unknown) {
    const parsed = SendMessageDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.messages.sendMessage(user.id, id, parsed.data);
  }

  @Post('conversations/:id/read')
  markRead(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.messages.markRead(user.id, id);
  }
}
