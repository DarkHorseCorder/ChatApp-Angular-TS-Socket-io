import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, tap, throwError } from 'rxjs';
import { environment as env } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class InterceptService implements HttpInterceptor {

error = {
  statusCodes : {
    FORBIDDEN: 403,
    USERSEXISTS: 409
  }
}

  constructor() { }


  handleReqPiped = (next, req) => {
    return next.handle(req)
      .pipe(
        retry(1),
        catchError((error: HttpErrorResponse) => {
          let errorMessage = '';
          // if (error.error instanceof ErrorEvent) {
            // client-side error
            errorMessage = `Error: ${error.error.message}`;
          // } else {
          //   // server-side error
          //   errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          // }
          return throwError(errorMessage);
        })
      );
  }
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url) {
      let apiUrl = '';
      // const apiUrl = (isDevMode()) ? devEnv.apiPaths[0] : (localStorage.env === 'uat') ? uatEnv.apiPaths[0] : prodEnv.apiPaths[0];
        apiUrl = env.apiPaths[0];

      const duplicate = req.clone(
        {
          url: apiUrl.concat(req.url),
          headers: req.headers.set('Authorization', localStorage.getItem('access_jwt'))
        }
      );
      return this.handleReqPiped(next, duplicate)
    }
    return next.handle(req)
      .pipe(
        retry(1),
        catchError((error: HttpErrorResponse) => {
          let errorMessage = '';
          // if (error.error instanceof ErrorEvent) {
            // client-side error
            errorMessage = `Error: ${error.error.message}`;
          // } else {
            // server-side error
            // errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          // }
          return throwError(errorMessage);
        })
      );
  }
}
