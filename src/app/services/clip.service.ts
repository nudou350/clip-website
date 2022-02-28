import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference,
  QuerySnapshot
} from "@angular/fire/compat/firestore";
import IClip from "../models/clip.model";
import {AngularFireAuth} from "@angular/fire/compat/auth";
import {BehaviorSubject, combineLatest, map, Observable, of, switchMap} from "rxjs";
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class ClipService implements  Resolve<IClip | null>{

  public clipsCollection : AngularFirestoreCollection<IClip>
  pageClips: IClip[] = []
  pendingReq = false
  constructor(
    private db : AngularFirestore,
    private auth: AngularFireAuth,
    private storage: AngularFireStorage,
    private router : Router
  ) {
    this.clipsCollection = db.collection('clips')
  }

  async createClip(data: IClip): Promise<DocumentReference<IClip>>{
    return await this.clipsCollection.add(data)
  }

  getUserClips(sort$: BehaviorSubject<string>) {
    return combineLatest([this.auth.user, sort$]).pipe( //combineLatest deixa um observable se inscrever em 2 objetos ao msm tempo
      switchMap(values => { //switchmap requer um operator retornando
        const [user,sort] = values
        if(!user){
          return of([])
        }
        const query = this.clipsCollection.ref.where( //a query where n inicia sozinha
          'uid', '==', user.uid

        ).orderBy(
          'timestamp',
          sort === '1' ? 'desc' : 'asc'
        )

        return query.get() //chamada pra inciar a query
      }),
      map(snapshot => (snapshot as QuerySnapshot<IClip>).docs)
    )
  }

  updateClip(id:string, title: string){
    this.clipsCollection.doc(id).update({
      title: title
    })
  }

  async deleteClip(clip: IClip){
    const clipRef = this.storage.ref(`clips/${clip.fileName}`)
    const screenshotRef = this.storage.ref(
      `screenshots/${clip.screenshotFileName}`
    )
    await clipRef.delete()
    await screenshotRef.delete()
    await this.clipsCollection.doc(clip.docID).delete()
  }

  async GetClips(){

    if(this.pendingReq){
      return
    }
    this.pendingReq = true
    let query = this.clipsCollection.ref.orderBy('timestamp', 'desc').limit(3)

    const {length} = this.pageClips

    if(length){
      const lastDocID = this.pageClips[length -1].docID
      const lastDoc = await this.clipsCollection.doc(lastDocID).get().toPromise()

      query = query.startAfter(lastDoc)
    }

    const snapshot = await query.get()
    snapshot.forEach(doc => {
      this.pageClips.push({
        docID: doc.id,
        ...doc.data()
      })
    })
    this.pendingReq = false
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.clipsCollection.doc(route.params['id']).get().pipe(
      map(snapshot => {
        const data = snapshot.data()

        if(!data){
          this.router.navigate(['/'])
          return null
        }
        return data
      })
    )
  }
}
