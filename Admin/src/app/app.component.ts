import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false   // ← indispensable
})
export class AppComponent {
  title = 'skote-angular-vertical';
}