import {
  Middleware,
  ExpressErrorMiddlewareInterface
} from "routing-controllers";
import { Response } from "express";
import { isArray } from "class-validator";
import { logger } from "../logger";
import moment = require("moment");

@Middleware({ type: "after" })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, request: any, response: Response, next: any) {
    console.log("Eror handler do something...", error);
    const statusCode = !!error.httpCode ? error.httpCode : response.statusCode;

    // handle class-validator error and send responce accordingly
    if (!!error.errors && isArray(error.errors)) {
      const validationErrors = error.errors.reduce((acc: any[], currentElement: any) => {

        //for children object validation
        if (currentElement.children.length > 0 && isArray(currentElement.children)) {
          acc.push(...processChildErrors(currentElement.children, currentElement.property))
        } else {
          acc.push({
            parent_property: null,
            property: currentElement.property,
            constraints: Object.values(currentElement.constraints).join(" & ")
          })
        }

        return acc;
      }, [])

      let errorObj = {
        statusCode: statusCode,
        date: moment().format('YYYY-MM-DD hh:mm'),
        message: validationErrors,
        request_url: request.url,
        request_data: request.method === "GET" ? request.query || request.params : request.body,
        trace: error.stack
      }
      logger.error(errorObj);
      return response.status(statusCode).json(validationErrors)

    }

    let errorObj = {
      statusCode: statusCode,
      date: moment().format('YYYY-MM-DD hh:mm'),
      message: error.message,
      request_url: request.url,
      request_data: request.method === "GET" ? request.query || request.params : request.body,
      trace: error.stack
    }
    logger.error(errorObj);

    const Error = {
      status: false,
      message: error.message,
    }

    // default response
    response.status(statusCode).json(Error);
  }
}

const processChildErrors = (errArr: any[], parent?: any) => {

  const errorMessageArr = errArr.reduce((acc: any[], current: any) => {

    if (current.children && current.children.length > 0) {
      acc.push(...processChildErrors(current.children, parent))
    } else {
      acc.push({
        parent_property: parent,
        property: current.property,
        message: Object.values(current.constraints).join(" & ")
      })
    }
    return acc;
  }, [])

  return errorMessageArr;
}