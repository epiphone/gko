using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace VT6
{
    /// <summary>
    /// Label joka laukaisee Routed Eventin kun sen päälle tiputetaan tavaraa.
    /// </summary>
    public class EventLabel : Label
    {
        public EventLabel()
        {
            AllowDrop = true;
            Drop += new DragEventHandler(OnDrop);
        }

        public static readonly RoutedEvent MyDropEvent =
            EventManager.RegisterRoutedEvent("MyDropEvent",
            RoutingStrategy.Bubble, typeof(DropEventHandler), typeof(EventLabel));

        public delegate void DropEventHandler(object sender, DropEventArgs args);

        public event DropEventHandler MyDrop
        {
            add { AddHandler(MyDropEvent, value); }
            remove { RemoveHandler(MyDropEvent, value); }
        }

        public void OnDrop(object sender, DragEventArgs e)
        {
            if (e.Data.GetDataPresent(typeof(int)))
            {
                var addition = (int)e.Data.GetData(typeof(int));
                RaiseEvent(new DropEventArgs(MyDropEvent, addition));
            }

        }
    }


    /// <summary>
    /// Parametriluokka MyDropEventille.
    /// </summary>
    public class DropEventArgs : RoutedEventArgs
    {
        public int Addition { get; set; }

        /// <summary>
        /// Constructs a new CustomEventArgs object
        /// using the parameters provided
        /// </summary>
        /// <param name="someNumber">the
        ///    value for the events args</param>
        public DropEventArgs(RoutedEvent routedEvent, int addition)
            : base(routedEvent)
        {
            this.Addition = addition;
        }
    }
}
