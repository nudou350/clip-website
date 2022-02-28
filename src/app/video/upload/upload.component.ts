import { Component, OnDestroy } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AngularFireStorage, AngularFireUploadTask} from "@angular/fire/compat/storage";
import {v4 as uuid} from "uuid";
import {forkJoin, pipe, switchMap,combineLatest} from "rxjs";
import {AngularFireAuth} from "@angular/fire/compat/auth";
import firebase from "firebase/compat/app";
import {ClipService} from "../../services/clip.service";
import {Router} from "@angular/router";
import {FfmpegService} from "../../services/ffmpeg.service";



@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnDestroy {
  isDragover = false
  file:File | null = null
  nextStep = false
  //alert section
  showAlert = false
  alertMsg="Please wait! Your video is being uploaded"
  alertColor = 'blue'
  inSubmission = false
  //end of alert
  percentage = 0
  showPercentage = false
  user : firebase.User | null = null
  task ?: AngularFireUploadTask
  screenshots: string[]  =[]
  selectedScreenshot = ''
  screenshotTask?: AngularFireUploadTask

  title = new FormControl('', [Validators.required, Validators.minLength(3)])

  uploadForm = new FormGroup({
    title: this.title
  })

  constructor(
    private storage : AngularFireStorage,
    private auth: AngularFireAuth,
    private clipsService: ClipService,
    private router: Router,
    public ffmpegService : FfmpegService
  ){
    auth.user.subscribe(user => this.user = user)
    this.ffmpegService.init()
    }

  ngOnDestroy(): void {
    this.task?.cancel()
  }

  async storeFile($event : Event){

    if(this.ffmpegService.isRunning){
      return //bloqueia a acao do usuario enquanto ta processando os videos
    }
    this.isDragover = false
  //verificacao se o arquivo veio de dragndrop ou de input file, pois os caminhos sao diferentes
    this.file = (($event as DragEvent).dataTransfer) ? ($event as DragEvent).dataTransfer?.files.item(0) ?? null :
      ($event.target as HTMLInputElement).files?.item(0) ?? null


    if(!this.file || this.file.type !== 'video/mp4'){
      return
    }

    this.screenshots = await this.ffmpegService.getScreenshots(this.file)

    this.selectedScreenshot = this.screenshots[0]

    this.title.setValue(this.file.name.replace(/\.[^/.]+$/ , '' ))
    this.nextStep = true
  }

  async uploadFile(){
    this.uploadForm.disable() // desativa o form pra evitar  conflito na submissao

    this.showAlert = true
    this.alertMsg="Please wait! Your photo is being uploaded!"
    this.alertColor = 'blue'
    this.inSubmission = true
    this.showPercentage = true
    //end of alert reset
    const clipFileName = uuid()
    //const clipPath= `clips/${this.file?.name}` pode gerar redundancia de nome e sobrepor
    const clipPath= `clips/${clipFileName}.mp4`

    const screenshotBlob = await this.ffmpegService.blobFromURL(
      this.selectedScreenshot
    )
    const screenshotPath = `screenshots/${clipFileName}.png`

    this.task =  this.storage.upload(clipPath, this.file)
    const clipRef = this.storage.ref(clipPath)

    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob)

    const screenshotRef = this.storage.ref(screenshotPath)

    //metodo simples pra pegar so %
    combineLatest(
      [this.task.percentageChanges(),
      this.screenshotTask.percentageChanges()
      ]).subscribe((progress) =>{
        const[clipProgress, screenshotProgress] = progress
        if(!clipProgress || !!screenshotProgress){
          return
        }

        const total = clipProgress + screenshotProgress
      this.percentage = total as number / 200 //100 + 100% de cada
    })

    forkJoin([
      this.task.snapshotChanges(),
      this.screenshotTask.snapshotChanges()]).pipe(
      switchMap(() =>forkJoin([
        clipRef.getDownloadURL(),
        screenshotRef.getDownloadURL()]))
    ).subscribe({
      next: async (urls) => {
        const [clipURL, screenshotURL] = urls
        const clip = {
          uid : this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value,
          fileName: `${clipFileName}.mp4`,
          url: clipURL,
          screenshotURL: screenshotURL,
          screenshotFileName: `${clipFileName}.png`,
          timestamp : firebase.firestore.FieldValue.serverTimestamp()

        }

        const clipDocRef = await this.clipsService.createClip(clip)
        this.alertColor= 'green',
          this.alertMsg= 'Success! Your video has been uploaded!',
          this.showPercentage = false

        setTimeout(() => {
          this.router.navigate([
            'clip', clipDocRef.id
          ])
        },1000)
      },
      error: (error) => {
        this.uploadForm.enable()
        this.alertColor= 'red',
          this.alertMsg = 'Upload failed! Try again later',
          this.inSubmission = true,
          this.showPercentage = false,
          console.error(error)

      }
    })



  }

}
