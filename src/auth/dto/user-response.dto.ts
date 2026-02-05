export class UserResponseDto {
  id!: string;
  email!: string;
  roles!: string[]; // Flattened role names
  isActive!: boolean;
  createdAt!: Date;
}
