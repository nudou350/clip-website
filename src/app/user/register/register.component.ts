import { Component} from '@angular/core';
import {FormGroup, FormControl, Validators} from "@angular/forms";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  constructor(
  private auth: AuthService
  ) {}

  inSubmission = false


  name= new FormControl('', [Validators.required, Validators.minLength(3)])
  email= new FormControl('', [Validators.email, Validators.required])
  age= new FormControl('',[Validators.min(18), Validators.required, Validators.max(120)])
  password= new FormControl('', [Validators.required, Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)])
  confirm_password= new FormControl('', [Validators.required])
  phoneNumber= new FormControl('', [Validators.required, Validators.minLength(16), Validators.maxLength(16)])

  showAlert = false
  alertMsg = 'Please wait! Your account is being created.'
  alertColor = 'blue'

  registerForm = new FormGroup({
    name :this.name,
    email : this.email,
    age : this.age,
    password : this.password,
    confirm_password : this.confirm_password,
    phoneNumber : this.phoneNumber
  })


  async register(){
    this.showAlert = true;
    this.alertMsg = "Please wait! Your account is being created"
    this.alertColor = 'blue'
    this.inSubmission = true


    try{
      await this.auth.createUser(this.registerForm.value)
    }
    catch (e){
      console.log(e)
      this.alertMsg = 'An error ocurred. Try again later'
      this.alertColor = 'red'
      this.inSubmission = false
      return
    }

    this.alertMsg= 'Success! Account created'
    this.alertColor = 'green'

  }


}
