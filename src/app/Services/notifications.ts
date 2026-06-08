import { Injectable } from '@angular/core';
import {SwPush} from "@angular/service-worker";
import {  HttpClient } from "@angular/common/http";
import { environment } from '../../environments/environment.prod';
import { NotificationDto } from '../Models/Dto/NotificationDto';

@Injectable({
  providedIn: 'root',
})
export class Notifications {
  
  private readonly VAPID_PUBLIC_KEY = 'BHsRGFM108YdZjmoUupXm7A48gxA-7QtbsHT2m6R0--xDPe6zl333fFBPa_IiGI0KLAhbtKDyrSTmE2RXrc4kw8';
  private readonly apiUrl = environment.apiUrl;
  private userid: number = parseInt(localStorage.getItem('userId') || '0');

  constructor(private swPush: SwPush, private http: HttpClient) {}

  subscribeToNotification(){
    this.swPush.requestSubscription({serverPublicKey: this.VAPID_PUBLIC_KEY}).then(subscription => {
      // console.log("Push Subscription", subscription);

      this.http.post(`${this.apiUrl}/api/PushSubscriptions/subscribe`, {subscription: subscription, userId: this.userid}).subscribe(() => {
        console.log("Subscription saved to database.");
      }, error => {
        console.error("Error saving subscription to database:", error);
      });
      
    }).catch(err => console.error("Could not subscribe to notifications", err));
  }

  sendTestNotiToAll(notification: NotificationDto){
    this.http.post(`${this.apiUrl}/api/PushSubscriptions/sendToAll`, notification).subscribe(() => {
      console.log("Test notification sent to all users.");
    }, error => {
      console.error("Error sending test notification to all users:", error);
    });
  }

  // sendStockRequestNotification(){

  // }
  

}
