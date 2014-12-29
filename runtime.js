// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
// *** CHANGE THE BEHAVIOR ID HERE *** - must match the "id" property in edittime.js
//           vvvvvvvvvv
cr.behaviors.mn2dCarPhysics = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	// *** CHANGE THE BEHAVIOR ID HERE *** - must match the "id" property in edittime.js
	//                               vvvvvvvvvv
	var behaviorProto = cr.behaviors.mn2dCarPhysics.prototype;
		
	/////////////////////////////////////
	// Behavior type class
	behaviorProto.Type = function(behavior, objtype)
	{
		this.behavior = behavior;
		this.objtype = objtype;
		this.runtime = behavior.runtime;
	};
	
	var behtypeProto = behaviorProto.Type.prototype;

	behtypeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Behavior instance class
	behaviorProto.Instance = function(type, inst)
	{
		this.type = type;
		this.behavior = type.behavior;
		this.inst = inst;				// associated object instance to modify
		
		this.runtime = type.runtime;
	};
	
	var behinstProto = behaviorProto.Instance.prototype;

	behinstProto.onCreate = function()
	{	
		// Load properties
		this.MaxSpeed					= this.properties[0];
		this.MaxSteering	 			= mn2dMath.PI / this.properties[1];
		this.SteerSpeed					= this.properties[2];
		this.Accelerate 				= this.properties[3];
		this.BrakeReverse 				= this.properties[4];
		// this.properties[5] is empty
		this.FrictionAnchorXpoint		= this.properties[6];
		this.FrictionAnchorYpoint		= this.properties[7];
		this.MaxSkidTorque				= this.properties[8];
		this.MaxSkidForce				= this.properties[9];
		// this.properties[10] is empty
		this.LowestTranslationJoint		= this.properties[11];
		this.HighestTranslationJoint	= this.properties[12];
		this.MaxTorqueForFrontWheel		= this.properties[13];
		this.MaxTorqueForBackWheel		= this.properties[14];
		this.BodyTorqueOffset			= this.properties[15];
		
		this.TopDownCarIsActive		= false;
		this.SideViewCarIsActive	= false;
				
		this.BodyObject				= null;
		
		this.LeftForwardWheelObject	= null;
		this.RightForwardWheelObject= null;
		this.LeftBackWheelObject	= null;
		this.RightBackWheelObject	= null;
		this.FrontWheelAxelObject	= null;
		this.BackWheelAxelObject	= null;
		
		this.LeftWheelJoint 		= null;
		this.RightWheelJoint 		= null;
		this.LeftBackWheelJoint 	= null;
		this.RightBackWheelJoint 	= null;
		this.FrontWheelAxelJoint	= null;
		this.BackWheelAxelJoint		= null;
		this.FrontBodyAxelJoint		= null;
		this.BackBodyAxelJoint		= null;
		
		this.PhysWorld				= null;
		this.PhysBody 				= null;
		this.PhysLFWheel			= null;
		this.PhysRFWheel			= null;
		this.PhysLBWheel			= null;
		this.PhysRBWheel			= null;
		this.PhysFrontWheelAxel		= null;
		this.PhysBackWheelAxel		= null;
				
		this.FrictionJoint			= null;
		
		this.LFWheelFrictionJoint	= null;
		this.RFWheelFrictionJoint	= null;
		this.LBWheelFrictionJoint	= null;
		this.RBWheelFrictionJoint	= null;
		
		this.BodyPhysicsInstance			= null;
		this.LFWheelPhysicsInstance			= null;
		this.RFWheelPhysicsInstance			= null;
		this.LBWheelPhysicsInstance			= null;
		this.RBWheelPhysicsInstance			= null;
		this.FrontWheelAxelPhysicsInstance	= null;
		this.BackWheelAxelPhysicsInstance	= null;
		
		this.LFWheelController		= null;
		this.RFWheelController		= null;
		this.LBWheelController		= null;
		this.RBWheelController		= null;
		
		this.WheelController		= null;
		
		// Internal values, should not be changed
		this.CarInputIsActive		= true;
		this.MaxMotorTorque			= 0.0;
		this.EngineSpeed			= 0.0;
		this.CurrentSpeed			= 0.0;
		this.PreviousEngineSpeed	= 0.0;
		this.SteeringAngle			= 0.0;
		this.TotalFriction			= 0.0;
		this.FrontWheelFriction		= 0.0;
		this.BackWheelFriction		= 0.0;
		this.TotalLinearDamp		= 0.0;
		this.PreviosXposition		= this.inst.x;
		this.PreviosYposition		= this.inst.y;
		
		this.DefaultFriction		= 0.0;
		
		
		
		
		// object is sealed after this call, so make sure any properties you'll ever need are created, e.g.
		// this.myValue = 0;
	};

	behinstProto.tick = function ()
	{
		var dt = this.runtime.getDt(this.inst);
		if(this.TopDownCarIsActive == true)
		{
			if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null || this.PhysLBWheel == null || this.PhysRBWheel == null){return;}
			/* CURRENTLY DISABLED DUE TO NEW BUILD VERSION WAS RELEASED BY SCIRRA, SO THIS *HACK* IS NOT SUSTAINABLE IN THE LONG RUN */
			// Check for a body rebuild flag
			/*
			if(this.LFWheelPhysicsInstance.BodyRecreated == true || this.RFWheelPhysicsInstance.BodyRecreated == true || 
				this.LBWheelPhysicsInstance.BodyRecreated == true || this.RBWheelPhysicsInstance.BodyRecreated == true)
			{
				var TempEngineSpeed 	= this.EngineSpeed;
				var TempSteeringAngle	= this.SteeringAngle;
				
				// The physics engine has rebuild one or more of the bodies, so I need to reapply all my settings...
				this.CreateTopDownCarPhysicsInstance();
				this.CurrentSpeed		= mn2dMath.Distance2D(this.inst.x, this.inst.y, this.PreviosXposition, this.PreviosYposition);
				this.EngineSpeed 		= TempEngineSpeed;
				this.SteeringAngle		= TempSteeringAngle;
			}
			*/
			this.CalculateFrictions();
			this.UpdateTopDownCarPhysicsInstace();
			this.UpdateCarVariables();
		}
		else if(this.SideViewCarIsActive == true)
		{
			if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null){return;}
			this.CalculateFrictions();
			this.UpdateSideViewCarPhysicsInstace();
			this.UpdateCarVariables();
		}
		// called every tick for you to update this.inst as necessary
		// dt is the amount of time passed since the last tick, in case it's a movement
	};

	//////////////////////////////////////
	// Conditions
	behaviorProto.cnds = {};
	var cnds = behaviorProto.cnds;

	cnds.IsCarPhysicsInputActive 						= function ()		{return this.CarInputIsActive;};

	//////////////////////////////////////
	// Actions
	behaviorProto.acts = {};
	var acts = behaviorProto.acts;

	acts.SetMaxSteerSpeedValue							= function(Value)												{this.SteerSpeed = Value;}	
	acts.SetMaxHorsepowerValue							= function(Value)												{this.MaxSpeed = Value;}
	acts.SetMaxSteeringValue							= function(Value)												{this.MaxSteering = mn2dMath.PI / Value;}
	acts.TurnRightInProcentageCarPhysicsInstance		= function(Procentage)											{if(this.CarInputIsActive == false){return;}if(this.TopDownCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null || this.PhysLBWheel == null || this.PhysRBWheel == null){return;}}if(this.SideViewCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null){return;}}this.SetRightTurnSteering(Procentage);return;}
	acts.TurnRightCarPhysicsInstance					= function()													{if(this.CarInputIsActive == false){return;}if(this.TopDownCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null || this.PhysLBWheel == null || this.PhysRBWheel == null){return;}}if(this.SideViewCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null){return;}}this.SetRightTurnSteering(100.0);return;}
	acts.TurnLeftInProcentageCarPhysicsInstance			= function(Procentage)											{if(this.CarInputIsActive == false){return;}if(this.TopDownCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null || this.PhysLBWheel == null || this.PhysRBWheel == null){return;}}if(this.SideViewCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null){return;}}this.SetLeftTurnSteering(Procentage);return;}
	acts.TurnLeftCarPhysicsInstance						= function()													{if(this.CarInputIsActive == false){return;}if(this.TopDownCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null || this.PhysLBWheel == null || this.PhysRBWheel == null){return;}}if(this.SideViewCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null){return;}}this.SetLeftTurnSteering(100.0);return;}
	acts.BrakeReverseInProcentageCarPhysicsInstance		= function(Procentage)											{if(this.CarInputIsActive == false){return;}if(this.TopDownCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null || this.PhysLBWheel == null || this.PhysRBWheel == null){return;}}if(this.SideViewCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null){return;}}this.SetBrakeReverseSpeed(Procentage);return;}
	acts.BrakeReverseCarPhysicsInstance					= function()													{if(this.CarInputIsActive == false){return;}if(this.TopDownCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null || this.PhysLBWheel == null || this.PhysRBWheel == null){return;}}if(this.SideViewCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null){return;}}this.SetBrakeReverseSpeed(100.0);return;}
	acts.AccelerateInProcentageCarPhysicsInstance		= function(Procentage)											{if(this.CarInputIsActive == false){return;}if(this.TopDownCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null || this.PhysLBWheel == null || this.PhysRBWheel == null){return;}}if(this.SideViewCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null){return;}}this.SetAccelerationSpeed(Procentage);return;}
	acts.AccelerateCarPhysicsInstance 					= function()													{if(this.CarInputIsActive == false){return;}if(this.TopDownCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null || this.PhysLBWheel == null || this.PhysRBWheel == null){return;}}if(this.SideViewCarIsActive == true){if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null){return;}}this.SetAccelerationSpeed(100.0);return;}
	acts.ActivateCarPhysicsInput						= function(ActivateCar)											{if(ActivateCar == 0){this.CarInputIsActive = false;}if(ActivateCar == 1){this.CarInputIsActive = true;}return;}
	acts.CreateTopDownCarPhysicsInstance 				= function(LFWheel, RFWheel, LBWheel, RBWheel, MaxMotorTorque)	{this.BodyObject = this.inst;this.LeftForwardWheelObject = LFWheel;this.RightForwardWheelObject = RFWheel;this.LeftBackWheelObject	= LBWheel;this.RightBackWheelObject	= RBWheel;this.MaxMotorTorque = MaxMotorTorque;this.CreateTopDownCarPhysicsInstance();this.TopDownCarIsActive = true;this.SideViewCarIsActive = false;/* Successfull */return}
	acts.CreateSideViewCarPhysicsInstance				= function(ForwardWheel, BackwardWheel, BackAxel, ForwardAxel)	{this.BodyObject = this.inst;this.LeftForwardWheelObject = BackwardWheel;this.RightForwardWheelObject = ForwardWheel;this.FrontWheelAxelObject = ForwardAxel;this.BackWheelAxelObject = BackAxel;this.CreateSideViewCarPhysicsInstance();this.TopDownCarIsActive = false;this.SideViewCarIsActive = true;/* Successfull */return;}
	acts.UpdateMaxTorqueForSideViewCarPhysicsInstance	= function(FrontMaxTorque, BackMaxTorque)						{this.MaxTorqueForFrontWheel = FrontMaxTorque;this.MaxTorqueForBackWheel = BackMaxTorque;return;}
	//////////////////////////////////////
	// Expressions
	behaviorProto.exps = {};
	var exps = behaviorProto.exps;
	
	// ret.set_float(0.5);			// for returning floats
	// ret.set_string("Hello");		// for ef_return_string
	// ret.set_any("woo");			// for ef_return_any, accepts either a number or string	
	exps.GetPhysicsCarSpeed							= function (ret)			{ret.set_float(this.CurrentSpeed);}
	exps.GetFrontWheelAvgFriction					= function (ret)			{ret.set_float(this.FrontWheelFriction);}
	exps.GetBackWheelAvgFriction					= function (ret)			{ret.set_float(this.BackWheelFriction);}
	exps.GetWheelAvgFriction						= function (ret)			{ret.set_float(this.TotalFriction);}
		
	/* CAR PHYSICS SPECIFIC FUNCTIONS */
	behinstProto.UpdateCarVariables					= function()				{this.CurrentSpeed = mn2dMath.Distance2D(this.inst.x, this.inst.y, this.PreviosXposition, this.PreviosYposition);if(this.CurrentSpeed == 0.0){this.EngineSpeed = 0.0;}this.PreviosXposition	= this.inst.x;this.PreviosYposition 	= this.inst.y;var TotalSpeedOffset	= ((this.TotalFriction * this.BodyPhysicsInstance.linearDamping) + 0.1);if(this.EngineSpeed > 0){this.EngineSpeed -= TotalSpeedOffset;}if(this.EngineSpeed < 0){this.EngineSpeed += TotalSpeedOffset;}}
	behinstProto.SetRightTurnSteering				= function(Procentage)		{this.SteeringAngle = (this.MaxSteering * (Procentage/100.0));return;}
	behinstProto.SetLeftTurnSteering				= function(Procentage)		{this.SteeringAngle = -(this.MaxSteering * (Procentage/100.0));return;}	
	behinstProto.SetBrakeReverseSpeed				= function(Procentage)		{this.EngineSpeed += (((this.FrontWheelFriction) * this.BrakeReverse) * (Procentage/100.0));if(this.EngineSpeed > this.MaxSpeed){this.EngineSpeed = this.MaxSpeed;}return;}
	behinstProto.SetAccelerationSpeed				= function(Procentage)		{this.EngineSpeed -= (((this.FrontWheelFriction) * this.Accelerate) * (Procentage/100.0));if(this.EngineSpeed < -this.MaxSpeed){this.EngineSpeed = -this.MaxSpeed;}return;}	
	behinstProto.CalculateFrictions					= function()				{var LFWheelFriction = this.DefaultFriction;var RFWheelFriction = this.DefaultFriction;var LFWheelDampning = this.DefaultFriction;var RFWheelDampning = this.DefaultFriction;if(this.LFWheelPhysicsInstance != null){LFWheelFriction = this.LFWheelPhysicsInstance.friction;LFWheelDampning = this.LFWheelPhysicsInstance.linearDamping;}if(this.RFWheelPhysicsInstance != null){RFWheelFriction	= this.RFWheelPhysicsInstance.friction;RFWheelDampning = this.RFWheelPhysicsInstance.linearDamping;}var LBWheelFriction = this.DefaultFriction;var RBWheelFriction = this.DefaultFriction;var LBWheelDampning = this.DefaultFriction;var RBWheelDampning = this.DefaultFriction;if(this.LBWheelPhysicsInstance != null){LBWheelFriction = this.LBWheelPhysicsInstance.friction;LBWheelDampning = this.LBWheelPhysicsInstance.linearDamping;}if(this.RBWheelPhysicsInstance != null){RBWheelFriction = this.RBWheelPhysicsInstance.friction;RBWheelDampning = this.RBWheelPhysicsInstance.linearDamping;}this.FrontWheelFriction = ((LFWheelFriction + RFWheelFriction) / 2);this.BackWheelFriction 	= ((LBWheelFriction + RBWheelFriction) / 2);this.TotalFriction 		= ((LFWheelFriction + RFWheelFriction + LBWheelFriction + RBWheelFriction) / 4);this.TotalLinearDamp	= ((LFWheelDampning + RFWheelDampning + LBWheelDampning + RBWheelDampning) / 4.0);}
	behinstProto.UpdateSideViewCarPhysicsInstace	= function()
	{
		if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null){return;}
		this.FrontWheelAxelJoint.SetMotorSpeed(-this.EngineSpeed);
		this.BackWheelAxelJoint.SetMotorSpeed(-this.EngineSpeed);

		this.FrontWheelAxelJoint.SetMaxMotorTorque(this.MaxTorqueForFrontWheel);
 		this.BackWheelAxelJoint.SetMaxMotorTorque(this.MaxTorqueForBackWheel);
		
		this.BackBodyAxelJoint.SetMaxMotorForce(20+Math.abs(800*Math.pow(this.BackBodyAxelJoint.GetJointTranslation(), 2)));
		this.FrontBodyAxelJoint.SetMaxMotorForce(20+Math.abs(800*Math.pow(this.BackBodyAxelJoint.GetJointTranslation(), 2)));
		
		this.BackBodyAxelJoint.SetMotorSpeed(-4 * Math.pow(this.BackBodyAxelJoint.GetJointTranslation(), 1));
		this.FrontBodyAxelJoint.SetMotorSpeed((this.FrontBodyAxelJoint.GetMotorSpeed() - 10 * this.FrontBodyAxelJoint.GetJointTranslation())*0.4);
		this.PhysBody.ApplyTorque((this.BodyTorqueOffset * this.EngineSpeed));
	}
	
	behinstProto.UpdateTopDownCarPhysicsInstace	= function()
	{
		if(this.PhysWorld == null || this.PhysBody == null || this.PhysLFWheel == null || this.PhysRFWheel == null || this.PhysLBWheel == null || this.PhysRBWheel == null){return;}
	
		/* Driving */
		var LeftBodyTransform = this.PhysLFWheel.GetTransform();
		var LeftBodyDirection = LeftBodyTransform.R.col2.Copy();
		LeftBodyDirection.Multiply( this.EngineSpeed );
		this.PhysLFWheel.ApplyForce(LeftBodyDirection, this.PhysLFWheel.GetPosition());


		
		var RightBodyTransform = this.PhysRFWheel.GetTransform();
		var RightBodyDirection = RightBodyTransform.R.col2.Copy();
		RightBodyDirection.Multiply( this.EngineSpeed );
		this.PhysRFWheel.ApplyForce(RightBodyDirection, this.PhysRFWheel.GetPosition());	

		
		/* Steering */
		var MotorSpeed = 0;
		MotorSpeed = this.SteeringAngle - this.LeftWheelJoint.GetJointAngle();
		this.LeftWheelJoint.SetMotorSpeed( (MotorSpeed) * this.SteerSpeed );
		
		MotorSpeed = 0;
		MotorSpeed = this.SteeringAngle - this.RightWheelJoint.GetJointAngle();
		this.RightWheelJoint.SetMotorSpeed( (MotorSpeed) * this.SteerSpeed );

		var dt = this.runtime.getDt(this.inst);
		var TimeStep = new Box2D.Dynamics.b2TimeStep(dt, 1.0 * dt /* dtRatio */, this.behavior.velocityIterations, this.behavior.positionIterations, false);
	
		this.WheelController.SetAxisAligned((this.BackWheelFriction * 100.0), (this.BackWheelFriction * 100.0));
		this.WheelController.Step(TimeStep);

		this.LFWheelFrictionJoint.InitVelocityConstraints(TimeStep);
		this.RFWheelFrictionJoint.InitVelocityConstraints(TimeStep);
		this.LBWheelFrictionJoint.InitVelocityConstraints(TimeStep);
		this.RBWheelFrictionJoint.InitVelocityConstraints(TimeStep);
		
		this.LFWheelFrictionJoint.SolveVelocityConstraints(TimeStep);
		this.RFWheelFrictionJoint.SolveVelocityConstraints(TimeStep);
		this.LBWheelFrictionJoint.SolveVelocityConstraints(TimeStep);
		this.RBWheelFrictionJoint.SolveVelocityConstraints(TimeStep);
	
		this.SteeringAngle 			= 0.0;
		this.PreviousEngineSpeed	= this.EngineSpeed;
	
		return;
	}
	
	behinstProto.SetPhysicsInstances				= function()			{for(var i = 0; i < this.inst.behavior_insts.length; i++){if(this.inst.behavior_insts[i].type.name == "Physics"){this.BodyPhysicsInstance	= this.inst.behavior_insts[i];this.PhysWorld				= this.inst.behavior_insts[i].world;this.PhysBody 				= this.inst.behavior_insts[i].body;break;}}/* If the main body does not belong to the physics world, there is no need to continue */if(this.PhysWorld == null){return;}if(this.LeftForwardWheelObject != null){var CurrentLFWheel = this.LeftForwardWheelObject.getFirstPicked();for(var i = 0; i < CurrentLFWheel.behavior_insts.length; i++){if(CurrentLFWheel.behavior_insts[i].type.name == "Physics"){this.LFWheelPhysicsInstance	= CurrentLFWheel.behavior_insts[i];this.PhysLFWheel 			= CurrentLFWheel.behavior_insts[i].body;break;}}}if(this.RightForwardWheelObject != null){var CurrentRFWheel = this.RightForwardWheelObject.getFirstPicked();for(var i = 0; i < CurrentRFWheel.behavior_insts.length; i++){if(CurrentRFWheel.behavior_insts[i].type.name == "Physics"){this.RFWheelPhysicsInstance	= CurrentRFWheel.behavior_insts[i];this.PhysRFWheel 			= CurrentRFWheel.behavior_insts[i].body;break;}}}if(this.LeftBackWheelObject != null){var CurrentLBWheel = this.LeftBackWheelObject.getFirstPicked();for(var i = 0; i < CurrentLBWheel.behavior_insts.length; i++){if(CurrentLBWheel.behavior_insts[i].type.name == "Physics"){this.LBWheelPhysicsInstance	= CurrentLBWheel.behavior_insts[i];this.PhysLBWheel 			= CurrentLBWheel.behavior_insts[i].body;break;}}}if(this.RightBackWheelObject != null){var CurrentRBWheel = this.RightBackWheelObject.getFirstPicked();for(var i = 0; i < CurrentRBWheel.behavior_insts.length; i++){if(CurrentRBWheel.behavior_insts[i].type.name == "Physics"){this.RBWheelPhysicsInstance	= CurrentRBWheel.behavior_insts[i];this.PhysRBWheel = CurrentRBWheel.behavior_insts[i].body;break;}}}if(this.FrontWheelAxelObject != null){var CurrentForwardAxel = this.FrontWheelAxelObject.getFirstPicked();for(var i = 0; i < CurrentForwardAxel.behavior_insts.length; i++){if(CurrentForwardAxel.behavior_insts[i].type.name == "Physics"){this.FrontWheelAxelPhysicsInstance	= CurrentForwardAxel.behavior_insts[i];this.PhysFrontWheelAxel 			= CurrentForwardAxel.behavior_insts[i].body;break;}}}if(this.BackWheelAxelObject != null){var CurrentBackwardAxel = this.BackWheelAxelObject.getFirstPicked();for(var i = 0; i < CurrentBackwardAxel.behavior_insts.length; i++){if(CurrentBackwardAxel.behavior_insts[i].type.name == "Physics"){this.BackWheelAxelPhysicsInstance	= CurrentBackwardAxel.behavior_insts[i];this.PhysBackWheelAxel = CurrentBackwardAxel.behavior_insts[i].body;break;}}}return;}
	behinstProto.CreateSideViewCarPhysicsInstance 	= function()			
	{
		this.SetPhysicsInstances();
		if(this.PhysWorld == null){return;}
		this.CalculateFrictions();
		
		var BodyAxelJointDef = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
		/*Front body axel joint */
		BodyAxelJointDef.Initialize(this.PhysBody, this.PhysFrontWheelAxel, this.PhysFrontWheelAxel.GetWorldCenter(), new Box2D.Common.Math.b2Vec2(mn2dMath.Cos(mn2dMath.PI/3), mn2dMath.Sin(mn2dMath.PI/3)));
		BodyAxelJointDef.lowerTranslation 	= this.LowestTranslationJoint;
        BodyAxelJointDef.upperTranslation 	= this.HighestTranslationJoint;
        BodyAxelJointDef.enableLimit 		= true;
        BodyAxelJointDef.enableMotor 		= true;
		this.FrontBodyAxelJoint			= this.PhysWorld.CreateJoint(BodyAxelJointDef);
		/* Back body axel joint */
		BodyAxelJointDef.Initialize(this.PhysBody, this.PhysBackWheelAxel, this.PhysBackWheelAxel.GetWorldCenter(), new Box2D.Common.Math.b2Vec2(-mn2dMath.Cos(mn2dMath.PI/3), mn2dMath.Sin(mn2dMath.PI/3)));
		this.BackBodyAxelJoint			= this.PhysWorld.CreateJoint(BodyAxelJointDef);
		
		/* Create motor joints */
		var WheelAxelJoint 				= new Box2D.Dynamics.Joints.b2RevoluteJointDef();
		WheelAxelJoint.enableMotor 		= true;
		/* Front wheel axel joint */
		WheelAxelJoint.Initialize(this.PhysFrontWheelAxel, this.PhysRFWheel, this.PhysRFWheel.GetWorldCenter());
		this.FrontWheelAxelJoint		= this.PhysWorld.CreateJoint(WheelAxelJoint);
		/* Back wheel axel joint */
		WheelAxelJoint.Initialize(this.PhysBackWheelAxel, this.PhysLFWheel, this.PhysLFWheel.GetWorldCenter());
		this.BackWheelAxelJoint			= this.PhysWorld.CreateJoint(WheelAxelJoint);
		/* Successfull */
		return;
	}
	
	behinstProto.CreateTopDownCarPhysicsInstance	= function()
	{
		
	
	
		/* If the main body does not belong to the physics world, there is no need to continue */
		this.SetPhysicsInstances();
		if(this.PhysWorld == null){return;}
		this.CalculateFrictions();
		
		//---------
		this.PhysLFWheel.SetAngle(this.inst.angle);//this.inst.angle
		this.PhysRFWheel.SetAngle(this.inst.angle);//this.inst.angle
		//---------
		
		var leftJointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
		leftJointDef.Initialize(this.PhysBody, this.PhysLFWheel, this.PhysLFWheel.GetWorldCenter());
		leftJointDef.enableMotor = true;
		leftJointDef.maxMotorTorque = this.MaxMotorTorque;
		leftJointDef.collideConnected = false;
		
		var rightJointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
		rightJointDef.Initialize(this.PhysBody, this.PhysRFWheel, this.PhysRFWheel.GetWorldCenter());
		rightJointDef.enableMotor = true;
		rightJointDef.maxMotorTorque = this.MaxMotorTorque;
		rightJointDef.collideConnected = false;
		
		//---------
		this.PhysLBWheel.SetAngle(this.inst.angle);//this.inst.angle
		this.PhysRBWheel.SetAngle(this.inst.angle);//this.inst.angle
		//---------
		
		this.LeftWheelJoint 	= this.PhysWorld.CreateJoint(leftJointDef);
		this.RightWheelJoint 	= this.PhysWorld.CreateJoint(rightJointDef);
							
		var leftRearJointDef = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
		leftRearJointDef.Initialize(this.PhysBody, this.PhysLBWheel, this.PhysLBWheel.GetWorldCenter(), new Box2D.Common.Math.b2Vec2(1,0));
		leftRearJointDef.enableLimit = true;
		leftRearJointDef.lowerTranslation = leftRearJointDef.upperTranslation = 0;
		leftRearJointDef.collideConnected = false;
		
		var rightRearJointDef = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
		rightRearJointDef.Initialize(this.PhysBody, this.PhysRBWheel, this.PhysRBWheel.GetWorldCenter(), new Box2D.Common.Math.b2Vec2(1,0));
		rightRearJointDef.enableLimit = true;
		rightRearJointDef.lowerTranslation = rightRearJointDef.upperTranslation = 0;
		rightRearJointDef.collideConnected = false;
		
		this.LeftBackWheelJoint 	= this.PhysWorld.CreateJoint(leftRearJointDef);
		this.RightBackWheelJoint 	= this.PhysWorld.CreateJoint(rightRearJointDef);
		
		/* DOCS. http://www.box2dflash.org/docs/2.1a/reference/ */
		var CurrentFriction = 0.0;		
		CurrentFriction = this.LFWheelPhysicsInstance.friction;
		var LFWFrictionJointDef		= new Box2D.Dynamics.Joints.b2FrictionJointDef();
		LFWFrictionJointDef.Initialize(this.PhysBody, this.PhysLFWheel, Box2D.Common.Math.b2Vec2.Get(this.FrictionAnchorXpoint, this.FrictionAnchorYpoint));
		LFWFrictionJointDef.maxForce = this.MaxSkidTorque;
		LFWFrictionJointDef.maxTorque = this.MaxSkidForce;
				
		CurrentFriction = this.RFWheelPhysicsInstance.friction;
		var RFWFrictionJointDef		= new Box2D.Dynamics.Joints.b2FrictionJointDef();
		RFWFrictionJointDef.Initialize(this.PhysBody, this.PhysRFWheel, Box2D.Common.Math.b2Vec2.Get(this.FrictionAnchorXpoint, this.FrictionAnchorYpoint));
		RFWFrictionJointDef.maxForce = this.MaxSkidTorque;
		RFWFrictionJointDef.maxTorque = this.MaxSkidForce;
		
		CurrentFriction = this.LBWheelPhysicsInstance.friction;
		var LBWFrictionJointDef		= new Box2D.Dynamics.Joints.b2FrictionJointDef();
		LBWFrictionJointDef.Initialize(this.PhysBody, this.PhysLBWheel, Box2D.Common.Math.b2Vec2.Get(this.FrictionAnchorXpoint, this.FrictionAnchorYpoint));
		LBWFrictionJointDef.maxForce = this.MaxSkidTorque;
		LBWFrictionJointDef.maxTorque = this.MaxSkidForce;
		
		CurrentFriction = this.RBWheelPhysicsInstance.friction;
		var RBWFrictionJointDef		= new Box2D.Dynamics.Joints.b2FrictionJointDef();
		RBWFrictionJointDef.Initialize(this.PhysBody, this.PhysRBWheel, Box2D.Common.Math.b2Vec2.Get(this.FrictionAnchorXpoint, this.FrictionAnchorYpoint));
		RBWFrictionJointDef.maxForce = this.MaxSkidTorque;
		RBWFrictionJointDef.maxTorque = this.MaxSkidForce;
		
		this.LFWheelFrictionJoint	= new Box2D.Dynamics.Joints.b2FrictionJoint(LFWFrictionJointDef);
		this.RFWheelFrictionJoint	= new Box2D.Dynamics.Joints.b2FrictionJoint(RFWFrictionJointDef);
		this.LBWheelFrictionJoint	= new Box2D.Dynamics.Joints.b2FrictionJoint(LBWFrictionJointDef);
		this.RBWheelFrictionJoint	= new Box2D.Dynamics.Joints.b2FrictionJoint(RBWFrictionJointDef);
			
	
			
		this.WheelController = new Box2D.Dynamics.Controllers.b2TensorDampingController();
		this.WheelController.AddBody(this.PhysLFWheel);
		this.WheelController.AddBody(this.PhysRFWheel);
		this.WheelController.AddBody(this.PhysLBWheel);
		this.WheelController.AddBody(this.PhysRBWheel);
		this.WheelController.SetAxisAligned((this.BackWheelFriction * 100.0), (this.BackWheelFriction * 100.0));
		

		
		/* Successfull */		
		return;
	}
	 
/* 	************************************************************************ 
	mn2dMath Class
		Math helper class. Consists of different math functions.
		
		v1.0:
			+ PI definition
			+ Cos and sin calculations
			+ Lerp function
			+ Min function (float, float)
			+ Max function (float, float)
			+ Dot product calculation (Array, Array)
			+ Square root calculation
			+ Randomize function
			+ Randomize function for float
			+ Interpolator function (although identical to Lerp(), I will keep it for now)
			+ ToRadians converter function
			+ Transform2dVector function. Takes a mn2dVector and a mn2dMatrix as inparameter and returns a mn2dVector that is transformed by these two inparameters
	************************************************************************ */
var mn2dMath = 
{
	"PI"				: 3.141592653589793,
	"Cos"				: function(Angle)								{return Math.cos(Angle);},
	"Sin"				: function(Angle)								{return Math.sin(Angle);},
	"Lerp" 				: function(a, b, f)								{return a + f * (b - a);},
	"Min"				: function(a, b)								{if( a < 0 && b >= 0){return a;}if(a >= 0 && b < 0){return b;}if(a < 0 && b < 0){if(a > b){return b;}return a;}if(a > b){return b;}	else{return a;}return a;},
	"Max"				: function(a, b)								{if( a < 0 && b >= 0){return b;}if(a >= 0 && b < 0){return a;}if(a < 0 && b < 0){if(a > b){return a;}return b;}if(a > b){return a;}	else{return b;}return a;},	
	"Dot"				: function(a, b)								{var Result = 0;var Limit = mn2dMath.Min(a.length, b.length);for (var i = 0; i < Limit; i++){Result += a[i] * b[i];}return Result;},
	"Cross"				: function(x1, y1, x2, y2)						{/*(U,V)=(U.x*V.y-U.y*V.x)*/return( x1 * y2 - y1 * x2 );},
	"Normalize2D"		: function(x, y)								{return mn2dMath.Sqrt((x * x) + (y * y));},
	"Sqrt"				: function(Value)								{var a = Value;var x = 1;for(var i = 0; i < Value; i++){x = 0.5 * ( x+a / x );}return x;},
	"Randomize"			: function(MaxValue)							{return Math.floor(Math.random() * MaxValue)},
	"RandomizeFloat"	: function(MinValue, MaxValue)					{return MinValue + (MaxValue -MinValue)*Math.random()},
	"Interpolator" 		: function(StartValue, EndValue, Progression)	{return StartValue + (EndValue - StartValue) * Progression;},
	"ToDegrees"			: function(Radians)								{return (Radians * (180.0 / mn2dMath.PI));},
	"ToRadians"			: function(Angle)								{return (Angle * (mn2dMath.PI / 180.0));},
	"Transform2dVector"	: function(Vector, Matrix)						{var TransformedX = 0.0; var TransformedY = 0.0;var TransformedVector = new mn2dVector(0.0, 0.0); TransformedX = Vector.m_X * Matrix.m_Matrix[0] + Vector.m_Y * Matrix.m_Matrix[1];TransformedY = Vector.m_X * Matrix.m_Matrix[3] + Vector.m_Y * Matrix.m_Matrix[4];TransformedVector.SetNewPoint(TransformedX, TransformedY);return TransformedVector;},
	"Opposite"			: function(Value)								{return (Value * -1);},
	"ForwardVectorX"	: function(Angle)								{return mn2dMath.Cos(Angle);},
	"ForwardVectorY"	: function(Angle)								{return mn2dMath.Sin(Angle);},
	"Distance2D"		: function(x1, y1, x2, y2)						{var DistanceXaxis = (x1 - x2) * (x1 - x2);var DistanceYaxis = (y1 - y2) * (y1 - y2);return (mn2dMath.Sqrt((DistanceXaxis + DistanceYaxis)));}
};	 
}());