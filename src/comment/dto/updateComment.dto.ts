import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdateCommentDto {

    @IsNotEmpty()
    @IsOptional()
    readonly content?: string;

}