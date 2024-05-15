import { Body, Controller, Delete, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags("Comments")
@Controller('comments')
export class CommentController {

    constructor(private readonly commentService: CommentService) {}

    @UseGuards(AuthGuard("jwt"))
    @Post("create")
    create(@Body() createCommentDto: CreateCommentDto, @Req() request: Request) {
        const userId = request.user["id"];
        return this.commentService.create(createCommentDto, userId);
    }

    @UseGuards(AuthGuard("jwt"))
    @Delete("delete/:id")
    delete(@Req() request: Request, @Param("id", ParseIntPipe) commentId: number) {
        const userId = request.user["id"];
        return this.commentService.delete(commentId, userId);
    }

    @UseGuards(AuthGuard("jwt"))
    @Put("update/:id")
    update(@Req() request: Request, @Param("id", ParseIntPipe) postId: number, @Body() updateCommentDto: UpdateCommentDto) {
        const userId = request.user["id"];
        return this.commentService.update(postId, userId, updateCommentDto);
    }

}
