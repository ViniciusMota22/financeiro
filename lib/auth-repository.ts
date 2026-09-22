import {prisma} from './db';
import type {UserRepository} from './auth-service';
export const userRepository:UserRepository={
  findByEmail(email){return prisma.user.findUnique({where:{email},select:{id:true,email:true,password:true}});},
  create(email,password){return prisma.user.create({data:{email,password},select:{id:true,email:true,password:true}});}
};
