import { Router, ActivatedRoute } from '@angular/router';
import { ChatService } from './../../services/chat.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as io from 'socket.io-client';
import { environment as env } from 'src/environments/environment';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss']
})
export class InboxComponent implements OnInit {

  @ViewChild('messageThead') messageThead: ElementRef;

  message: FormControl
  searchbar = new FormControl();
  filteredOptions: Observable<string[]>;
  socket: SocketIOClient.Socket;
  userId: any;
  data: any = {
    username: '',
    chatlist: [],
    selectedFriendId: null,
    selectedFriendName: null,
    messages: []
  }
  userstate: any;
  noResults: boolean = false;

  constructor(
    private chat: ChatService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.queryParams.subscribe(e => {
      if (!Object.keys(e).length && !localStorage.getItem('userState'))
        this.router.navigate(['login'])

      this.userId = +e.userId;
    })
  }

  ngOnInit(): void {
    this.message = new FormControl('', Validators.required);
    let userstate = localStorage.getItem('userState');
    if (userstate !== 'undefined') this.userstate = JSON.parse(userstate)
    this.checkUser();
    this.connectSocketServer();
    this.socketEmit('chat-list', this.userId);
    this.socket.on('chat-list-response', this.handleMessageList)
    this.socket.on('add-message-response', this.handleMessageRes)
  }

  private _filter(value: string): string[] {
    this.noResults = false;
    const filterValue = value.toLowerCase();

    const filtered = this.data.chatlist.filter((option: any) => option.username.toLowerCase().includes(filterValue));
    if (!filtered.length && this.searchbar.value) this.noResults = true
    return filtered
  }

  handleMessageRes = (response: any) => {
    if (response && response.fromUserId == this.data.selectedFriendId) {
      this.data.messages.push(response);
      setTimeout(() => {
        this.messageThead.nativeElement.scrollTop = this.messageThead.nativeElement.scrollHeight + 500
      }, 100);
    }
  }

  handleMessageList = (res: any) => {
    {
      if (!res.error) {
        if (res.singleUser) {
          /*
          * Removing duplicate user from chat list array
          */
          if (this.data.chatlist.length > 0) {
            this.data.chatlist = this.data.chatlist
          }
          /*
          * Adding new online user into chat list array
          */
          this.data.chatlist.push(res.chatList);
        } else if (res.userDisconnected) {
          /*
          * Removing a user from chat list, if user goes offline
          */
          this.data.chatlist = this.data.chatlist.filter(function (obj) {
            return obj.socketid !== res.socketId;
          });
        } else {
          /*
          * Updating entire chatlist if user logs in
          */
          this.data.chatlist = res.chatList;
        }
        this.filteredOptions = this.searchbar.valueChanges.pipe(
          startWith(''),
          map(value => this._filter(value)),
        );
      } else {
        alert(`Faild to load Chat list`);
      }
    }
  }


  checkUser = async () => {
    try {
      // if(!this.userId) this.router.navigate(['login'])
      let res = await this.chat.userSessionCheck(this.userId).toPromise();
      if (!res['username']) this.router.navigate(['login'])
    } catch (error) {

    }
  }


  selectFriendToChat = async (friendId: any) => {
    /*
    * Highlighting the selected user from the chat list
    */
    const friendData = this.data.chatlist.filter((obj) => {
      return obj.id === friendId;
    });
    this.data.selectedFriendName = friendData[0]['username'];
    this.data.selectedFriendId = friendId;
    /**
    * This HTTP call will fetch chat between two users
    */
    let userId = this.userId;
    let response = await this.chat.getmessages({ userId, friendId }).toPromise();
    this.data.messages = response['messages'];
    setTimeout(() => {
      this.messageThead.nativeElement.scrollTop = this.messageThead.nativeElement.scrollHeight + 500
    }, 100);
  }


  sendMessage = () => {
    if(!this.message.value) return false;
    let toUserId = null;
    let toSocketId = null;

    /* Fetching the selected User from the chat list starts */
    let selectedFriendId = this.data.selectedFriendId;
    if (selectedFriendId === null) {
      return null;
    }
    const friendData = this.data.chatlist.filter((obj) => {
      return obj.id === selectedFriendId;
    });
    /* Fetching the selected User from the chat list ends */

    /* Emmiting socket event to server with Message, starts */
    if (friendData.length > 0) {

      toUserId = friendData[0]['id'];
      toSocketId = friendData[0]['socketid'];

      let messagePacket = {
        message: this.message.value,
        fromUserId: this.userId,
        toUserId: toUserId,
        toSocketId: toSocketId
      };
      this.data.messages.push(messagePacket);
      this.socketEmit(`add-message`, messagePacket);

      this.message.setValue('');
      setTimeout(() => {
        this.messageThead.nativeElement.scrollTop = this.messageThead.nativeElement.scrollHeight + 500
      }, 100);
    } else {
      alert('Unexpected Error Occured,Please contact Admin');
    }
    /* Emmiting socket event to server with Message, ends */

  }





  connectSocketServer() {
    const socket = io.connect(env.apiPaths[0], { query: `userId=${this.userId}` });
    console.log(env.apiPaths[0])
    this.socket = socket;
  }

  socketEmit(eventName, params) {
    this.socket.emit(eventName, params);
  }

  getAvatarLetter(name: string) {
    return name.toUpperCase()
  }

  logout = () => {
    this.socketEmit('logout', this.userId);
    localStorage.clear();
    this.router.navigate(['login']);
  }

  checkPosition(par1, par2) {
    par1 = Number(par1)
    return par1 === par2;
  }
}
