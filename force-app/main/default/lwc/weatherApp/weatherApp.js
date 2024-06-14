import { LightningElement } from 'lwc';
import getWeatherDetail from '@salesforce/apex/WeatherApi.getWeatherDetail'; 


export default class WeatherApp extends LightningElement {

        cityName='';
        weatherDetails={};

    handleCityNameEvent(event){
            this.cityName = event.detail.value;
    }

    handleButtonClick(){
        getWeatherDetail({cityName : this.cityName})
           .then((result) => {
                this.weatherDetails = result;

           })     

        }



    }
