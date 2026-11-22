import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personAddOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonIcon]
})
export class RegisterPage implements OnInit {
  registrationData = signal({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  constructor(
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({
      'person-add-outline': personAddOutline,
      'checkmark-circle-outline': checkmarkCircleOutline
    });
  }

  ngOnInit(): void {
    const savedDarkMode = localStorage.getItem('nutribantay_dark_mode') === 'true';
    if (savedDarkMode) {
      document.body.classList.add('dark');
    }
  }

  updateField(field: 'fullName' | 'username' | 'password' | 'confirmPassword', value: string): void {
    this.registrationData.update(current => ({
      ...current,
      [field]: value
    }));
  }

  async onRegister(): Promise<void> {
    const currentData = this.registrationData();

    if (currentData.password !== currentData.confirmPassword) {
      const toast = await this.toastController.create({
        message: 'Passwords do not match. Please check and try again.',
        duration: 2500,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    const toast = await this.toastController.create({
      message: 'Account created successfully!',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();

    this.router.navigate(['/login']);
  }

  onCancel(): void {
    this.router.navigate(['/login']);
  }
}