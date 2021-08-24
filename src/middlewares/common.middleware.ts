import { Middleware, ExpressMiddlewareInterface } from "routing-controllers";
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "routing-controllers";
import { Utils } from "../helpers/Utils";
import { UserService } from "../services/mobile/user/user.service";

@Middleware({ type: "before" })
export class PreRequestMiddleware implements ExpressMiddlewareInterface {
	constructor(private userSrv: UserService) {}
	async use(
		request: any,
		response: Response,
		next: NextFunction
	): Promise<void> {
		const whitelist = [
			"/user/forgotpassword",
			"/admin/login",
			"/admin/forgotPassword",
			"/user/requestOTP",
			"library/getLibrary",
			"/user/login",
		];

		if (whitelist.includes(request.url.toLowerCase())) {
			return next();
		}

		const token = request.headers.authorization;
		if (!token) throw new BadRequestError("Please provide token");

		const user: any = Utils.varifyToken(token);

		// request["user"] = user;
		next();
	}
}

@Middleware({ type: "after" })
export class PostRequestMiddleware implements ExpressMiddlewareInterface {
	use(request: Request, response: any, next: any): void {
		console.log("do something after...");
		next();
	}
}
