import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import Token from '../model/token.js'
import User from '../model/user.js';

dotenv.config();

export const signupUser = async (request, response) => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username: request.body.username });
        if (existingUser) {
            return response.status(400).json({ msg: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(request.body.password, 10);

        const user = { 
            username: request.body.username, 
            name: request.body.name, 
            password: hashedPassword 
        };

        const newUser = new User(user);
        await newUser.save();

        return response.status(200).json({ msg: 'Signup successful' });
    } catch (error) {
        console.error('Signup error:', error);
        return response.status(500).json({ msg: 'Error while signing up user: ' + error.message });
    }
}


export const loginUser = async (request, response) => {
    let user = await User.findOne({ username: request.body.username });
    if (!user) {
        return response.status(400).json({ msg: 'Username does not match' });
    }

    try {
        let match = await bcrypt.compare(request.body.password, user.password);
        if (match) {
            const accessToken = jwt.sign(user.toJSON(), process.env.ACCESS_SECRET_KEY, { expiresIn: '15m'});
            const refreshToken = jwt.sign(user.toJSON(), process.env.REFRESH_SECRET_KEY);
            
            const newToken = new Token({ token: refreshToken });
            await newToken.save();
        
            response.status(200).json({ accessToken: accessToken, refreshToken: refreshToken,name: user.name, username: user.username });
        
        } else {
            response.status(400).json({ msg: 'Password does not match' })
        }
    } catch (error) {
        response.status(500).json({ msg: 'error while login the user' })
    }
}

export const logoutUser = async (request, response) => {
    const token = request.body.token;
    await Token.deleteOne({ token: token });

    response.status(204).json({ msg: 'logout successfull' });
}