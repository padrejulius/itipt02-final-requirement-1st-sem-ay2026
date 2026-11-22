import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonItem, IonLabel, IonToggle, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, personCircleOutline, archiveOutline, locationOutline, moonOutline, notificationsOutline, shieldCheckmarkOutline, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, RouterLink, IonContent, IonButtons, IonButton, IonIcon, IonItem, IonLabel, IonToggle ] })

export class SettingsPage implements OnInit {
  healthWorkerName = signal<string>('Administrator');
  assignedStation = signal<string>('Barangay Health Station');
  darkMode = signal<boolean>(false);
  notifications = signal<boolean>(true);

  constructor(private router: Router, private alertController: AlertController) {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'person-circle-outline': personCircleOutline,
      'location-outline': locationOutline,
      'moon-outline': moonOutline,
      'notifications-outline': notificationsOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'log-out-outline': logOutOutline,
      'archive-outline': archiveOutline
    });
  }

  ngOnInit(): void {
    const savedDarkMode = localStorage.getItem('nutribantay_dark_mode') === 'true';
    this.darkMode.set(savedDarkMode);
    document.body.classList.toggle('dark', savedDarkMode);
  }

  toggleDarkMode(event: any): void {
    const checked = event.detail.checked;
    this.darkMode.set(checked);
    document.body.classList.toggle('dark', checked);
    localStorage.setItem('nutribantay_dark_mode', checked.toString());
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to log out from the NutriBantay system?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Log Out',
          role: 'destructive',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  goBack(): void {
    this.router.navigate(['/admin-home']);
  }

  goToArchive(): void {
    this.router.navigate(['/archive']);
  }

  toggleNotifications(event: any) {
    this.notifications.set(event.detail.checked);
    console.log('Notifications toggled:', event.detail.checked);
  }
}