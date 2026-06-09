import { Component } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { Notifications } from '../Services/notifications';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {

  PopupModalMessage: string = "";
  showPopupModal: boolean = false;

  constructor(private notificationService: Notifications){

  }

  enableNotifications() {
    // this.showPopupModal = true;
    // this.PopupModalMessage = "Notifications are already enabled";
    //   setTimeout(() => {
    //     this.showPopupModal = false;
    //     this.PopupModalMessage = "";
    //   }, 300);

    try{
      this.notificationService.subscribeToNotification();
    }catch(error: any){
      this.PopupModalMessage = error.error.message;
      console.log("Error message is: ", this.PopupModalMessage)
      this.showPopupModal = true;
      setTimeout(() => {
        this.showPopupModal = false;
        this.PopupModalMessage = "";
      }, 3000);
    }
  }












}
