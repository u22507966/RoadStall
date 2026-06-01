import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {OnInit} from '@angular/core';
import {SwUpdate} from '@angular/service-worker';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{

  constructor(private swUpdate: SwUpdate) {}

  ngOnInit(): void {

    if(!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates.subscribe(event => {
      if(event.type === 'VERSION_READY') {
        if(confirm('New version available. Load New Version?')) {
          window.location.reload();
        }
      }
    });

  }

  protected readonly title = signal('RoadStallSales');
}
