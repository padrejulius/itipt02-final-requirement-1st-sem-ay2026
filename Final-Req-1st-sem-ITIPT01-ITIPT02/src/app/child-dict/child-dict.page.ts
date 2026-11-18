import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonItem, IonSelect, IonSelectOption, IonList, IonItemSliding, IonItemOptions, IonItemOption, IonBadge, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, personAddOutline, personOutline, createOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-child-dict',
  templateUrl: './child-dict.page.html',
  styleUrls: ['./child-dict.page.scss'],
  imports: [CommonModule, FormsModule, HttpClientModule,IonHeader, RouterLink, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonItem, IonSelect, IonSelectOption, IonList, IonItemSliding, IonItemOptions, IonItemOption, IonBadge],})

export class ChildDictPage implements OnInit {
  constructor() {
    addIcons({ 
      'arrow-back-outline': arrowBackOutline, 
      'person-add-outline': personAddOutline, 
      'person-outline': personOutline, 
      'create-outline': createOutline, 
      'trash-outline': trashOutline 
    });
  }

  ngOnInit() {}
}
