import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import jwt from "jsonwebtoken"
import { HTTP_BAD_REQUEST } from "../constants/http_status";
import { sample_users } from "../data";
import { User, UserModel } from "../models/user.model";
import bcrypt from "bcryptjs"

const router = Router()

router.get("/seed", expressAsyncHandler(
    async (req, res) => {
        const userCount = await UserModel.countDocuments()
        if (userCount > 0) {
            res.send("seed is already done!")
            return
        } 
        await UserModel.create(sample_users)
        res.send("Seed is Done!")
    }
))

router.post("/login", expressAsyncHandler(
    async (req, res) => {
      const {email, password} = req.body;
      const user = await UserModel.findOne({email});
    
       if(user && (await bcrypt.compare(password,user.password))) {
        res.send(generateTokenResponse(user));
       }
       else{
         res.status(HTTP_BAD_REQUEST).send("Username or password is invalid!");
       }
    
    }
  ))

router.post("/register", expressAsyncHandler(
   async (req, res) => {
        const { name, email, password, address } = req.body
        const user = await UserModel.findOne({email})
        if (user) {
            res.status(HTTP_BAD_REQUEST).send('User is already exist, please login!')
            return
        }

        const encryptPassword = await bcrypt.hash(password, 10)
        const newUser:User = {
            id: "",
            name,
            email: email.toLowerCase(),
            password: encryptPassword,
            address,
            isAdmin: false
        }

        const dbUser = await UserModel.create(newUser)

        res.send(generateTokenResponse(dbUser))
   }
))

const generateTokenResponse = (user: any) => {
    const token = jwt.sign({
        email: user.email,
        isAdmin: user.isAdmin
    }, "SomeRandomText", {
        expiresIn: "30d"
    })

    user.token = token
    return user
}

export default router