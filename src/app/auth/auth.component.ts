import { ChatService } from './../../services/chat.service';
import { Component, isDevMode, OnInit } from '@angular/core';
import { Form, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  isLogin: boolean = true;

  login: FormGroup;
  register: FormGroup;
  usernameAvailable: boolean = true;
  constructor(
    private chat: ChatService,
    private fb: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginCheck();
    this.setAttrs();
    this.initiateCheckUserName = _.debounce(this.initiateCheckUserName,500);
  }

  loginCheck = () => {
    let userState = localStorage.getItem('userState');
    if(userState){
      userState = JSON.parse(userState);
      this.router.navigate(["home"], {queryParams: {userId: userState['userId']}})
    }
  }

  loginUser = async () => {
    try {
      let islogedin = await this.chat.loginUser(this.login.value).toPromise();
      if(islogedin['userId']) this.router.navigate(["home"], {queryParams : { userId :islogedin['userId']}} )
      const userState  = JSON.stringify(islogedin);
      localStorage.setItem('userState', userState )
    } catch (exec) {
      console.log(exec);
    }
  }

  setAttrs() {
    this.login = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    })
    this.register = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    })
  }


  initiateCheckUserName = async (e: any) => {
    try {
      this.usernameAvailable = false;
      let res = await this.chat.usernameCheck(e.target.value).toPromise();
      this.usernameAvailable = true;
    } catch (err) {
      if (isDevMode()) console.log(err);
      this.usernameAvailable =  false;
    }
  }


  registerUser = async () => {
    try {
      let res = await this.chat.registerUser(this.register.value).toPromise()
      if(res['error']){
        if(isDevMode()) return console.log(res['message'])
      }
      this.router.navigate(["home"], {queryParams : { userId :res['userId']}} )
      const userState  = JSON.stringify(res);
      localStorage.setItem('userState', userState )
    } catch (error) {
      if(isDevMode()) console.log(error)
    }
  }

  loginPage = (loc:string) => {
    if(loc === 'login')
    return this.isLogin  = true;

    this.isLogin = false;
  }

}
