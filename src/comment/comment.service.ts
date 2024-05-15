import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';

@Injectable()
export class CommentService {

    constructor(private readonly prismaService: PrismaService) {}

    async create(createCommentDto: CreateCommentDto, userId: number) {
        const { content, postId } = createCommentDto;
        const post = await this.prismaService.post.findUnique({ where: { id: postId }});
        if (!post) throw new NotFoundException("Post not found");
        const comment = await this.prismaService.comment.create({ data: { content, userId, postId }});
        return { message: "Comment created", comment };
    }

    async delete(commentId: number, userId: number) {
        const comment = await this.prismaService.comment.findUnique({ where: {id: commentId }});
        if (!comment) throw new NotFoundException("Comment not found");
        if (comment.userId !== userId) throw new ForbiddenException("Forbidden action");
        await this.prismaService.comment.delete({ where: { id: commentId }});
        return { message: "Comment deleted" };
    }

    async update(commentId: number, userId: number, updateCommentDto: UpdateCommentDto) {
        const comment = await this.prismaService.comment.findUnique({ where: {id: commentId }});
        if (!comment) throw new NotFoundException("Comment not found");
        if (comment.userId !== userId) throw new ForbiddenException("Forbidden action");
        await this.prismaService.comment.update({ where: { id: commentId }, data: { ...updateCommentDto }});
        return { message: "Comment updated" };
    }
}
