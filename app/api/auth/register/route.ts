import {makeAuthHandler} from '@/lib/auth-http';
import {userRepository} from '@/lib/auth-repository';
export const runtime='nodejs';
export const POST=makeAuthHandler('register',userRepository);
