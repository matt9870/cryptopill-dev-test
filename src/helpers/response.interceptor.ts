import { Interceptor, InterceptorInterface, Action } from "routing-controllers";
import { Messages } from '../constants';

@Interceptor()
export class ResponseInterceptor implements InterceptorInterface {

    intercept(action: Action, content: any) {

        const exempt = action.request.route.path;
        if (!exempt.match("/admin/verifyresetlink")) {
            const response = {
                success: true,
                data: content,
                message: Messages.SUCCESS_RECEIVED
            }
            return response;
        }

    }

}