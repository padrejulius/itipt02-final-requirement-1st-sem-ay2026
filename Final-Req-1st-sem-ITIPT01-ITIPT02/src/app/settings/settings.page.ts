import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel, IonToggle, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, personCircleOutline, archiveOutline, locationOutline, moonOutline, notificationsOutline, shieldCheckmarkOutline, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, RouterLink, IonContent, IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel, IonToggle]
})
export class SettingsPage implements OnInit {
  healthWorkerName: string = 'Administrator';
  assignedStation: string = 'Barangay Health Station';
  darkMode: boolean = localStorage.getItem('darkMode') === 'true';
  notifications: boolean = true;

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

  onDarkModeChange(event: any): void {
    const isDark = Boolean(event?.detail?.checked);
    this.darkMode = isDark;
    this.applyDarkMode(isDark);
  }

  applyDarkMode(isDark: boolean): void {
    localStorage.setItem('darkMode', String(isDark));
    document.body.classList.toggle('dark', isDark);
  }

  ngOnInit(): void {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedDarkMode;
    document.body.classList.toggle('dark', savedDarkMode);
  }

  toggleDarkMode(event: any): void {
    const checked = Boolean(event?.detail?.checked);
    this.darkMode = checked;
    this.applyDarkMode(checked);
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
    this.notifications = event.detail.checked;
    console.log('Notifications toggled:', event.detail.checked);
  }
}