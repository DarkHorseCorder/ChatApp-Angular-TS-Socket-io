import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient ) { }

  userSessionCheck = (userId : string) => {
    return this.http.post('/userSessionCheck',{userId})
  }


  loginUser = (payload:any) => {
    return this.http.post('/login', payload);
  }


  usernameCheck = (regUsername) =>{
    return this.http.post('/usernameCheck',{username:regUsername})
  }
  registerUser = ( payload ) =>{
    return this.http.post('/registerUser',payload)
  }

  getmessages = (payload) => {
    return this.http.post('/getmessages',payload)
  }

}
