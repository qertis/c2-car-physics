/* ************************************************************************ 
	Car physics v0.1
	Scirra Construct 2 behavior plugin (http://www.scirra.com)
	Created by Mikael Nilsson
	
	A behavior that utilizes the physics behavior and creates a vehicle with full physics
	capabilities that can be used as a vehicle inside a Construct project. 
	A physics car is based on a body with wheels and reacts to different speeds, wheel friction and properties 
	set inside Construct.
	
	The car physics is based on the Box2D physics engine with its built in controllers and joints.
	
	v0.1
		- ADDED			Created a tutorial page for this behavior plugin: http://www.scirra.com/tutorials/323/create-car-physics
		- UPDATE		Code structured and optimized for better performance.
		- ADDED			Added extra actions to enable more dynamic settings  specific for the sideview car physics in real time.
		- ADDED			Added extra properties variables to enable more dynamic settings specific for the sideview car physics.
		- ADDED			Added Sideview Car physics. A sideview physics car is based on a body, two wheels and two axels combined together. 
						The sideview car physics reacts just as the topdown car physics with wheel friction, linear dampning etc etc.
	v0.07
		- ADDED			Added a action that can enable or disable the input for the car physics. The car is still active and alive in the physics world, but does not
						respond to any inputs as long it is disabled.
		- ADDED			Added condition to check if a physics car input is active or not.
		- BUG			Fixed bug where the car collided with a object to a standstill, but the engine speed didnt go down to zero properly.		
	v0.06
		- CHANGE		"Deacceleration" property has changed to "Brake/reverse", and is a offset calculating on how fast the car brakes or accelerates when reversing.
		- CHANGE		De-acceleration (no input from the user) is now based on the average friction from the 4 wheels and the linearDamping from the body. The linearDamping
						of the body is intended to be like wind resistance, slowing down the car.
		- CHANGE		Added a check in the beginning of each tick to see if the physics engine did a body rebuild on any of the bodies.
						Due to the functionality in Construct, each time a variable is changed during runtime, the engine rebuilds the physics body at each tick, if neccessary.
						This caused the Car physics to loose all joints and connections. So now before updating anything, the behavior checks if the bodies has been rebuild, and rebuilds
						all needed joints and connections before updating the cars' variables.
		- CHANGE		Changed "HorsePower" variable to "MaxSpeed" variable in the properties.
		- REMOVED		Removed "Tensor dampning in x-axis" and "Tensor dampning in y-axis" from the properties, since these values are now calculated based on the wheel friction.
		- ADDED			Added skidding action to the physics car. The skidding is based on a given set of max torque and force and is then calculated based on the current friction for each wheel.
						Each wheel reacts individual to the skidding calculation.
		- ADDED			Added "Acceleration in procentage", "Brake/Reverse in procentage", "Turn left in procentage" and "Turn right in procentage" to the actions.
						These actions allows a more dynamic way to control the car physics.
		- ADDED			Added "GetPhysicsCarSpeed", "GetFrontWheelAvgFriction", "GetBackWheelAvgFriction" and "GetWheelAvgFriction" expressions.
		- ADDED			Added "Skid anchor point in x-axis" and "Skid anchor point in y-axis" in properties to set the anchor point for the skidding behavior.
		- ADDED			Added "Max skidding Torque" and "Max skidding force" to the properties to change the properties of the skidding calculation.
		- ADDED			Added "Max skidding Torque" and "Max skidding force" to the action list to change the properties of the skidding calculation in realtime.

	v0.05
		- ADDED			"Create top down 2WD car physics"-function. The top down view car physics is running based on different settings that can be changed in realtime, if needed.
						Much of the behavior of the car is based on the friction for the individual wheels.
	
************************************************************************ */

function GetBehaviorSettings()
{
	return {
		"name":			"Car physics",			// as appears in 'add behavior' dialog, can be changed as long as "id" stays the same
		"id":			"mn2dCarPhysics",		// this is used to identify this behavior and is saved to the project; never change it
		"version":		"0.1",					// (float in x.y format) Behavior version - C2 shows compatibility warnings based on this
		"description":	"Creates physics for vehicles",
		"author":		"Mikael Nilsson",
		"help url":		"http://www.scirra.com/tutorials/323/create-car-physics",
		"category":		"Movements",			// Prefer to re-use existing categories, but you can set anything here
		"flags":		0						// uncomment lines to enable flags...
						| bf_onlyone			// can only be added once to an object, e.g. solid
	};
};

////////////////////////////////////////
// Parameter types:
// AddNumberParam(label, description [, initial_string = "0"])			// a number
// AddStringParam(label, description [, initial_string = "\"\""])		// a string
// AddAnyTypeParam(label, description [, initial_string = "0"])			// accepts either a number or string
// AddCmpParam(label, description)										// combo with equal, not equal, less, etc.
// AddComboParamOption(text)											// (repeat before "AddComboParam" to add combo items)
// AddComboParam(label, description [, initial_selection = 0])			// a dropdown list parameter
// AddObjectParam(label, description)									// a button to click and pick an object type
// AddLayerParam(label, description)									// accepts either a layer number or name (string)
// AddLayoutParam(label, description)									// a dropdown list with all project layouts
// AddKeybParam(label, description)										// a button to click and press a key (returns a VK)
// AddAudioFileParam(label, description)								// a dropdown list with all imported project audio files

////////////////////////////////////////
// Conditions

// AddCondition(id,					// any positive integer to uniquely identify this condition
//				flags,				// (see docs) cf_none, cf_trigger, cf_fake_trigger, cf_static, cf_not_invertible,
//									// cf_deprecated, cf_incompatible_with_triggers, cf_looping
//				list_name,			// appears in event wizard list
//				category,			// category in event wizard list
//				display_str,		// as appears in event sheet - use {0}, {1} for parameters and also <b></b>, <i></i>, and {my} for the current behavior icon & name
//				description,		// appears in event wizard dialog when selected
//				script_name);		// corresponding runtime function name
				
// example				
AddCondition(0, cf_none, "Is input active?", "Current status", "{my} input is active", "Checks if the input of the physics car is active", "IsCarPhysicsInputActive");

////////////////////////////////////////
// Actions

// AddAction(id,				// any positive integer to uniquely identify this action
//			 flags,				// (see docs) af_none, af_deprecated
//			 list_name,			// appears in event wizard list
//			 category,			// category in event wizard list
//			 display_str,		// as appears in event sheet - use {0}, {1} for parameters and also <b></b>, <i></i>
//			 description,		// appears in event wizard dialog when selected
//			 script_name);		// corresponding runtime function name

// example
//AddAction(0, af_none, "Stop", "My category", "Stop {my}", "Description for my action!", "Stop");

/* CAR PHYSICS */
AddAction(3, af_none, "Accelerate", "Realtime controls", "{my} accelerates", "Accelerates the physics car", "AccelerateCarPhysicsInstance");
AddAction(4, af_none, "Brake/Reverse", "Realtime controls", "{my} brakes/reverses", "Brakes/reverses the physics car", "BrakeReverseCarPhysicsInstance");
AddAction(5, af_none, "Turn left", "Realtime controls", "{my} turns left", "Makes the physics car to turn left", "TurnLeftCarPhysicsInstance");
AddAction(6, af_none, "Turn right", "Realtime controls", "{my} turns right", "Makes the physics car to turn right", "TurnRightCarPhysicsInstance");

AddNumberParam("Max steering", "Max steering (the rotation angle of the wheel when turning) on the wheels", "5.0");
AddAction(7, af_none, "Set max steering", "Settings", "{my} max steering is set to {0}", "Set the max steering value for the physics car", "SetMaxSteeringValue");
AddNumberParam("Max horsePower", "Max horsepower applied to the car", "3.0");
AddAction(8, af_none, "Set horsePower", "Settings", "{my} max horsepower is set to {0}", "Set the max horsepower value for the physics car", "SetMaxHorsepowerValue");
AddNumberParam("Max steer speed", "Max steer speed (the speed the wheels rotates when turning) applied to the car", "5.0");
AddAction(9, af_none, "Set steer speed", "Settings", "{my} max steer speed is set to {0}", "Set the max steer speed value for the physics car", "SetMaxSteerSpeedValue");
AddNumberParam("Max ", "Max skidding torque", "100.0");
AddAction(10, af_none, "Max skidding torque", "Settings", "{my} max skidding torque is set to {0}", "Set the max skidding torque for the physics car", "SetMaxSkiddingTorqueValue");
AddNumberParam("Max ", "Max skidding force", "10.0");
AddAction(11, af_none, "Max skidding force", "Settings", "{my} max skidding force is set to {0}", "Set the max skidding force for the physics car", "SetMaxSkiddingForceValue");
AddNumberParam("Procentage (0-100)", "Acceleration in procentage(%)", "0.0");
AddAction(12, af_none, "Acceleration in procentage", "Realtime controls", "{my} is accelerating at {0}%", "Accelerates a given procentage of the maximum acceleration", "AccelerateInProcentageCarPhysicsInstance");
AddNumberParam("Procentage (0-100)", "Brake/Reverse in procentage(%)", "0.0");
AddAction(13, af_none, "Brake/Reverse in procentage", "Realtime controls", "{my} is braking/reversing at {0}%", "Brakes/Reverses a given procentage of the maximum acceleration", "BrakeReverseInProcentageCarPhysicsInstance");
AddNumberParam("Procentage (0-100)", "Turn left in procentage(%)", "0.0");
AddAction(14, af_none, "Turn left in procentage", "Realtime controls", "{my} is turning left at {0}%", "Turns left a given procentage of the maximum acceleration", "TurnLeftInProcentageCarPhysicsInstance");
AddNumberParam("Procentage (0-100)", "Turn right in procentage(%)", "0.0");
AddAction(15, af_none, "Turn right in procentage", "Realtime controls", "{my} is turning right at {0}%", "Turns right a given procentage of the maximum acceleration", "TurnRightInProcentageCarPhysicsInstance");
AddComboParamOption("disabled");
AddComboParamOption("enabled");
AddComboParam("State", "Activates or deactivates the car." , 0);
AddAction(16, af_none, "Activate/Deactivate Car", "Realtime controls", "{my} is currently {0}", "Set if the Car physics should be active or not. When deactivated (disabled) the car physics will not respond to any inputs.", "ActivateCarPhysicsInput");


/* TOP DOWN CAR PHYSICS */
AddObjectParam("Left front wheel", "physicalized car front left wheel");
AddObjectParam("Right front wheel", "physicalized car front right wheel");
AddObjectParam("Left back wheel", "physicalized car back left wheel");
AddObjectParam("Right back wheel", "physicalized car back right wheel");
AddNumberParam("Max Motor torque", "Max motor torque applied to the car", "500.0");
AddAction(1, af_none, "Create top down 2WD car physics", "Top down car physics", "{my} created top down 2WD car physics instance", "Creates a top down 2WD car physics instance.", "CreateTopDownCarPhysicsInstance");

/* SIDE VIEW CAR PHYSICS */
AddObjectParam("Front wheel", "physicalized car front wheel");
AddObjectParam("Back wheel", "physicalized car back wheel");
AddObjectParam("Front axel", "physicalized front axel");
AddObjectParam("Back axel", "physicalized back axel");
AddAction(2, af_none, "Create side view car physics", "Side view car physics", "{my} created side view car physics instance", "Creates a side view car physics instance.", "CreateSideViewCarPhysicsInstance");

AddNumberParam("Front wheel", "Max torque rotatino for the front wheel.", "12");
AddNumberParam("Back wheel", "Max torque rotatino for the back wheel.", "12");
AddAction(17, af_none, "Set max torque for wheels", "Side view car physics", "{my} set max front wheel torque to {0} and max back wheel torque to {1}", "Updates the maximum torque for both front and back wheel.", "UpdateMaxTorqueForSideViewCarPhysicsInstance");
////////////////////////////////////////
// Expressions

// AddExpression(id,			// any positive integer to uniquely identify this expression
//				 flags,			// (see docs) ef_none, ef_deprecated, ef_return_number, ef_return_string,
//								// ef_return_any, ef_variadic_parameters (one return flag must be specified)
//				 list_name,		// currently ignored, but set as if appeared in event wizard
//				 category,		// category in expressions panel
//				 exp_name,		// the expression name after the dot, e.g. "foo" for "myobject.foo" - also the runtime function name
//				 description);	// description in expressions panel

// example
AddExpression(0, ef_return_number, "Car speed", "Information", "GetPhysicsCarSpeed", "Return the current speed. This value is the amount of distance the car has moved since the last update.");
AddExpression(1, ef_return_number, "Average front wheel friction", "Topdown car physics", "GetFrontWheelAvgFriction", "Return average front wheel friction.");
AddExpression(2, ef_return_number, "Average back wheel friction", "Topdown car physics", "GetBackWheelAvgFriction", "Return average back wheel friction.");
AddExpression(3, ef_return_number, "Average wheel friction", "Topdown car physics", "GetWheelAvgFriction", "Return average wheel friction for all wheels.");
AddExpression(4, ef_return_number, "Average wheel friction", "Sideview car physics", "GetWheelAvgFriction", "Return average wheel friction for all wheels.");
////////////////////////////////////////
ACESDone();

////////////////////////////////////////
// Array of property grid properties for this plugin
// new cr.Property(ept_integer,		name,	initial_value,	description)		// an integer value
// new cr.Property(ept_float,		name,	initial_value,	description)		// a float value
// new cr.Property(ept_text,		name,	initial_value,	description)		// a string
// new cr.Property(ept_combo,		name,	"Item 1",		description, "Item 1|Item 2|Item 3")	// a dropdown list (initial_value is string of initially selected item)

var property_list = [
	//new cr.Property(ept_integer, 	"My property",		77,		"An example property.")
	new cr.Property(ept_float, 	"Max speed", 10.0, "Value to set how fast the car can drive."),
	new cr.Property(ept_float, 	"Max steering", 5.5, "Value to set the maximum allowed turning of the steering wheels."),
	new cr.Property(ept_float, 	"Steering speed", 5.0, "Value to set the speed of the steering wheels."),
	new cr.Property(ept_float, 	"Acceleration", 1.0, "Value to set how fast the car should acccelerate."),
	new cr.Property(ept_float, 	"Brake/reverse", 1.0, "Value to set how fast the car should brake/reverse."),
	new cr.Property(ept_text, "Topdown Car settings", "", "Specific settings for topdown car behavior"),
	new cr.Property(ept_float, 	"Skid anchor point in x-axis", 0.0, "Set the local anchor point relative to the wheels position."),
	new cr.Property(ept_float, 	"Skid anchor point in y-axis", 0.0, "Set the local anchor point relative to the wheels position."),
	new cr.Property(ept_float, 	"Max skidding torque", 1.0, "Value to set the maximum torque when skidding."),
	new cr.Property(ept_float, 	"Max skidding force", 1.0, "Value to set the maximum force when skidding."),
	new cr.Property(ept_text, "Sideview Car settings", "", "Specific settings for sideview car behavior"),
	new cr.Property(ept_text, "Lower translation on axles", "-0.3", "The lowest allowed translation for the axle joints. This controls the 'softness' of the axels."),
	new cr.Property(ept_text, "upper translation on axles", "0.5", "The highest allowed translation for the axle joints. This controls the 'softness' of the axels."),
	new cr.Property(ept_text, "Max torque rotation for front wheel", "12", "The max allowed torque rotation for the front wheel. To high can give strange effects."),
	new cr.Property(ept_text, "Max torque rotation for back wheel", "12", "The max allowed torque rotation for the back wheel. To high can give strange effects."),
	new cr.Property(ept_text, "Torque offset on body", "1.0", "The offset scales with the current engine power, and gives the effect of pressing the body backwards/forwards. Too high values may cause the car to spin around.")
	];
	
// Called by IDE when a new behavior type is to be created
function CreateIDEBehaviorType()
{
	return new IDEBehaviorType();
}

// Class representing a behavior type in the IDE
function IDEBehaviorType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new behavior instance of this type is to be created
IDEBehaviorType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance, this);
}

// Class representing an individual instance of the behavior in the IDE
function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
	
	// Save the constructor parameters
	this.instance = instance;
	this.type = type;
	
	// Set the default property values from the property table
	this.properties = {};
	
	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
		
	// any other properties here, e.g...
	// this.myValue = 0;
}

// Called by the IDE after all initialization on this instance has been completed
IDEInstance.prototype.OnCreate = function()
{
}

// Called by the IDE after a property has been changed
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
}
