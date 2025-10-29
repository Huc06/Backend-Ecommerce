import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany  } from 'typeorm'

@Entity('categories')
export class Category {
    @PrimaryColumn('uuid') 
    id: string;

    @Column({ unique: true})
    name: string;

    @Column({ nullable: true})
    description: string;
}