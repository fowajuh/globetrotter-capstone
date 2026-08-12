import {
  Body, Controller, Delete, Get, Param, Patch, Post,
  UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ItineraryService } from './itinerary.service';
import { CreateCommentDto, CreateStopDto, PatchStopDto, ReorderStopsDto } from './dto/stop.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ItineraryController {
  constructor(private itinerary: ItineraryService) {}

  @Post('trips/:tripId/stops')
  createStop(@Param('tripId') tripId: string, @CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = CreateStopDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.itinerary.createStop(tripId, user.id, parsed.data);
  }

  @Patch('stops/:id')
  patchStop(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = PatchStopDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.itinerary.patchStop(id, user.id, parsed.data);
  }

  @Delete('stops/:id')
  deleteStop(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.itinerary.deleteStop(id, user.id);
  }

  @Patch('stops/:id/reorder')
  reorder(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = ReorderStopsDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.itinerary.reorder(id, user.id, parsed.data);
  }

  @Get('stops/:id/comments')
  listComments(@Param('id') id: string) {
    return this.itinerary.listComments(id);
  }

  @Post('stops/:id/comments')
  addComment(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = CreateCommentDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.itinerary.addComment(id, user.id, parsed.data);
  }
}
