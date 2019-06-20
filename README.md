#Five9CRMSDKSamples

Examples of using [Five9 CRM SDK Javascript Library](https://app.five9.com/dev/sdk/crm/latest/doc/index.html)

###Dependencies
  - [Node.js](https://nodejs.org)
  - [Gulp](https://gulpjs.com)
###How to run project
   ``
   npm install
   gulp server
   ``
###Configuration
Project is running local https web server on your machine. Add following line to etc/hosts file:  
127.0.0.1	crm-sdk.five9lab.com

###Example
- Page demonstrating CRM SDK functions of Agent Desktop Toolkit embedded inside iframe https://crm-sdk.five9lab.com/iframe_api_v2.html
    For details see tutorial [Integrating ADT inside web page](https://app.five9.com/dev/sdk/crm/latest/doc/tutorial-basicintegration.html)
- Page demonstrating CRM SDK functions in combination with SalesForce CRM https://crm-sdk.five9lab.com/iframe_api_v2_cti.html
  This page should be embedded inside SalesForce CRM using Five9VirtualCallCenterFreedomLightingDemoInt.xml call center 
  definition file located in the root of the project. This page can work in combination with demo Lightning Components 
  [Salesforce package with examples](https://login.salesforce.com/packaging/installPackage.apexp?p0=04tf4000004Mbr5&isdtp=p1)
    For details see tutorials [Customizing existing integrations](https://app.five9.com/dev/sdk/crm/latest/doc/tutorial-custexisting.html) and 
    [Building proxy page](https://app.five9.com/dev/sdk/crm/latest/doc/tutorial-proxypage.html)
    
     
    