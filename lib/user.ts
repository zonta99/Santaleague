import { db } from "@/lib/db";
import {auth} from "@/auth";
import {currentUser} from "@/lib/auth";


const user  = currentUser();
console.log(user);

