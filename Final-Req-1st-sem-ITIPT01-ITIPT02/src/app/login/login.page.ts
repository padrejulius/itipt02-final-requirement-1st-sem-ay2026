import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heartCircleOutline, logInOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonIcon]
})
export class LoginPage {
  credentials = signal({ username: '', password: '' });

  constructor(private router: Router, private toastController: ToastController) {
    addIcons({
      'heart-circle-outline': heartCircleOutline,
      'log-in-outline': logInOutline
    });
  }

  updateField(field: 'username' | 'password', value: string): void {
    this.credentials.update(current => ({
      ...current,
      [field]: value
    }));
  }

  async onLogin(): Promise<void> {
    const currentCreds = this.credentials();
    if (!currentCreds.username.trim() || !currentCreds.password.trim()) {
      await this.presentToast('Please fill in both username and password.', 'danger');
      return;
    }

    if (currentCreds.username === 'admin' && currentCreds.password === '1234') {
      this.credentials.set({ username: '', password: '' });
      await this.presentToast('Login successful!');
      this.router.navigate(['/admin-home']);
    } else {
      await this.presentToast('Invalid username or password!', 'danger');
      return;
    }
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color,
      mode: 'ios',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  onCancel(): void {
    this.credentials.set({ username: '', password: '' });
    this.router.navigate(['/home']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}