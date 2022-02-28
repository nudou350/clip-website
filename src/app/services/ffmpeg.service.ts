import { Injectable } from '@angular/core';
import {createFFmpeg, fetchFile} from "@ffmpeg/ffmpeg";
import firebase from "firebase/compat";



@Injectable({
  providedIn: 'root'
})
export class FfmpegService {
  isRunning = false
  isReady = false
  private ffmpeg
  constructor() {
    this.ffmpeg = createFFmpeg({log:true, corePath:"https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js"})
  }

  async init(){
    if(this.isReady){
      return
    }

    await this.ffmpeg.load()
    this.isReady = true
  }

  async getScreenshots(file: File): Promise<string[]>{
    this.isRunning = true
    const data = await fetchFile(file) //transforma o arquivo em um array binario 8bit
    this.ffmpeg.FS('writeFile', file.name, data) //acessa o arquivo de memoria independente
    const seconds = [1,2,3]
    const commands = []

    seconds.forEach(second =>{
        commands.push(
          '-i', file.name,
          //output optionm
          '-ss', `00:00:0${second}`, //hora, min, segundo da primeira screenshot
          '-frames:v', '1', //numero de frames que vc quer no periodo acima
          '-filter:v', 'scale=510:-1', //dimensoes da screenshot, vai sempre ter width de 510 e o height em -1 deixa automatica pra nao esticar
          //output
          `output_0${second}.png`
        )
    }

    )
    await this.ffmpeg.run(
      //input
      ...commands //spread pra ter uma lista de strings
    )

    const screenshots : string[] = []

    seconds.forEach(second => {

        const screenshotFile = this.ffmpeg.FS(
          'readFile',
          `output_0${second}.png`
        )

       const screenshotBlob = new Blob(
          [screenshotFile.buffer],
          {
            type: 'image/png'
          }
        )

        const screenshotURL = URL.createObjectURL(screenshotBlob)

        screenshots.push(screenshotURL)
      })
    this.isRunning = false

    return screenshots
  }


  async blobFromURL(url : string) {
    const response = await fetch(url)
    const blob = await response.blob()
    return blob
  }





}
