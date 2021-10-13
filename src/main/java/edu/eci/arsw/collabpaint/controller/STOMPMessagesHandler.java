package edu.eci.arsw.collabpaint.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import edu.eci.arsw.collabpaint.model.Point;

@Controller
public class STOMPMessagesHandler {
	
	@Autowired
	SimpMessagingTemplate msg;
	
	int pointsLimit;
	private ConcurrentHashMap<String, ArrayList<Point>> points;
	
	public STOMPMessagesHandler() {
		pointsLimit = 4;
		points = new ConcurrentHashMap<>();
	}
	
	@MessageMapping("/newpoint.{drawID}")
	public void handlePointEvent(Point pt, @DestinationVariable String drawID) throws Exception{
		System.out.println("-------- Nuevo punto recibido en el servidor!: " + pt+" --------");
		if (points.containsKey(drawID)) {
			System.out.println("  -- ENTRA AL IF --");
			points.get(drawID).add(pt);
		} else {
			System.out.println("  -- ENTRA AL ELSE --");
			points.put(drawID, new ArrayList<Point>(Arrays.asList(pt)));
		}
		System.out.println("  ---- Puntos Acumulados: "+points.get(drawID).size()+" ----");
		msg.convertAndSend("/topic/newpoint."+drawID, pt);
		if (points.get(drawID).size() % pointsLimit == 0) {
			System.out.println("  ---- A NEW POLIGON WILL BE CREATED ----");
			System.out.println("  ---- Converted Array: "+Arrays.toString(points.get(drawID).toArray())+"----");
			System.out.println("  ---- Limits: ("+(points.get(drawID).size()-pointsLimit)+", "+points.get(drawID).size()+") ----");
			msg.convertAndSend(
					"/topic/newpolygon."+drawID,
					Arrays.copyOfRange(points.get(drawID).toArray(), points.get(drawID).size()-pointsLimit, points.get(drawID).size())
			);
		}
	}
}