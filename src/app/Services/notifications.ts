import { Injectable } from '@angular/core';
import {SwPush} from "@angular/service-worker";
import {  HttpClient } from "@angular/common/http";
import { environment } from '../../environments/environment';
import { NotificationDto } from '../Models/Dto/NotificationDto';

@Injectable({
  providedIn: 'root',
})
export class Notifications {
  
  private readonly VAPID_PUBLIC_KEY = 'BDb5808AydxxtQ25FMFwBbXulSwpne4p_pRAqh7PrJI4wmosQIH-tLR7VqG8m9ZlDhDBLV8FhC31031wYtPoywY';
  private readonly apiUrl = environment.apiUrl;
  private userid: number = parseInt(localStorage.getItem('userId') || '0');

  constructor(private swPush: SwPush, private http: HttpClient) {}

  subscribeToNotification(){
    this.swPush.requestSubscription({serverPublicKey: this.VAPID_PUBLIC_KEY}).then(subscription => {
      // console.log("Push Subscription", subscription);

      this.http.post(`${this.apiUrl}/api/PushSubscriptions/subscribe`, {subscription: subscription, userId: this.userid}).subscribe(() => {
        // console.log("Subscription saved to database.");
      }, error => {
        // console.error("Error saving subscription to database:", error);
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
