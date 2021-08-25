import "reflect-metadata"; // this shim is required
import { createExpressServer, useContainer, Action } from "routing-controllers";
import * as bodyParser from "body-parser";
import { BadRequestError } from "routing-controllers";
import { ResponseInterceptor } from "./helpers/response.interceptor";
import { Container } from "typedi";
import path = require("path");
import { CustomErrorHandler } from "./middlewares/errorhandler.middleware";
import { AdminUrlPreRequestMiddleware } from "./middlewares/adminurlaccess.middleware";

import { Utils } from "./helpers/Utils";
import Users from "./models/users.model";
require("./cronScript");

const swaggerUi = require("swagger-ui-express");

// for dependacy injection
useContainer(Container);

const expressApp = createExpressServer({
	controllers: [__dirname + "/controllers/**/*.{ts,js}"],
	cors: {
		origin: (origin: any, callback: any) => {
			!!origin ? callback(null, origin) : callback(null, "*");
		},
		methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
		allowedHeaders: [
			"authorization",
			"Authorization",
			"X-Requested-With",
			"content-type",
		],
		credentials: true,
		optionsSuccessStatus: 200,
	},
	middlewares: [CustomErrorHandler],
	interceptors: [ResponseInterceptor],
	defaultErrorHandler: false,
	currentUserChecker: async (action: Action) => {
		// here you can use request/response objects from action
		// you need to provide a user object that will be injected in controller actions
		// demo code:
		const token = action.request.headers["authorization"];
		const user: any = Utils.varifyToken(token);
		let userInfo: any = await Users.findOne({ where: { id: user.id } });
		if (!userInfo) throw new BadRequestError("User does not exists");
		// request["user"] = user;
		return user;
	},
});

expressApp.set("views", path.join(__dirname, "../views"));
expressApp.set("view engine", "pug");

expressApp.use(
	"/api-docs",
	swaggerUi.serve,
	swaggerUi.setup(require(path.resolve(`${__dirname}/../swagger/swagger.json`)))
);

expressApp.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

export default expressApp;
