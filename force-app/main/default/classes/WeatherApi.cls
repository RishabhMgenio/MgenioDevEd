public class WeatherApi {
    
	@AuraEnabled	
    public static WeatherApiWrapper getWeatherDetail(string cityName){
        
          //set endpoint url
          
       	string apikey = 'a9d82cbb06e07a8eec1dc5b5d5a3c4ed';
       	string endpoint = 'http://api.openweathermap.org/data/2.5/weather';
       	endpoint += '?q=' +cityName;
        endpoint += '&units=metric';
        endpoint += '&APPID=' +apikey;
        system.debug('endpointUrl= '+endpoint);
        
        //callout to weatherapi
        
        http http = new http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        
        HttpResponse res = http.send(req);
        system.debug('res===' +res+ ' body ' +JSON.deserializeUntyped(res.getBody()));
          
 
        //return weatherdetail	
        WeatherApiWrapper weatherDet = new WeatherApiWrapper();
        
        if(res.getStatusCode() == 200){
   			Map<String,object> result = (Map<String,object>)JSON.deserializeUntyped(res.getBody());
            weatherDet.city = String.valueOf(result.get('name'));
            Map<String,object> mainResult = (Map<String,object>)(result.get('main'));
            weatherDet.temperature = String.valueOf(mainResult.get('temp'));
            weatherDet.pressure = String.valueOf(mainResult.get('pressure'));
            weatherDet.humidity = String.valueOf(mainResult.get('humidity'));
            weatherDet.feelsLike = String.valueOf(mainResult.get('feels_like'));
            weatherDet.tempMin = String.valueOf(mainResult.get('temp_min'));    
            weatherDet.tempMax = String.valueOf(mainResult.get('temp_max'));
        }
        
        return weatherDet;
      
   
            
        
        
    }
    
    public class WeatherApiWrapper {
        
        @AuraEnabled public String city { get; set; }
    	@AuraEnabled public String temperature { get; set; }
        @AuraEnabled public String pressure { get; set; }
    	@AuraEnabled public String humidity { get; set; }
        @AuraEnabled public String feelsLike { get; set; }
    	@AuraEnabled public String tempMin { get; set; }
        @AuraEnabled public String tempMax { get; set; }
        
  
    
}
}