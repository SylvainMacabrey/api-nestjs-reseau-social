import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/createPost.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePostDto } from './dto/updatePost.dto';

@Injectable()
export class PostService {

    constructor(private readonly prismaService: PrismaService) {}

    async create(createPostDto: CreatePostDto, userId: number) {
        const { title, body } = createPostDto;
        const post = await this.prismaService.post.create({ data: { title, body, userId }});
        return { message: "Post created", post };
    }

    async getPosts() {
        return await this.prismaService.post.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    }
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                username: true
                            }
                        }
                    },
                }
            }
        });
    }

    async delete(postId: number, userId: number) {
        const post = await this.prismaService.post.findUnique({ where: {id: postId }});
        if (!post) throw new NotFoundException("Post not found");
        if (post.userId !== userId) throw new ForbiddenException("Forbidden action");
        await this.prismaService.post.delete({ where: { id: postId }});
        return { message: "Post deleted" };
    }

    async update(postId: number, userId: number, updatePostDto: UpdatePostDto) {
        const post = await this.prismaService.post.findUnique({ where: {id: postId }});
        if (!post) throw new NotFoundException("Post not found");
        if (post.userId !== userId) throw new ForbiddenException("Forbidden action");
        await this.prismaService.post.update({ where: { id: postId }, data: { ...updatePostDto }});
        return { message: "Post updated" };
    }
}
